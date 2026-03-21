// Scheduled Tasks Service (Cron Jobs) for GuinéaManager ERP
// Handles automated notifications, alerts, and maintenance tasks

import cron from 'node-cron';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import {
  sendPushToUser,
  generateDailySummary,
  generateSubscriptionExpiring,
} from './push.service';
import { sendSMS } from './notification.service';
import { getStockAlerts } from './stock.service';
import { checkExpiredDevis } from './devis.service';

// ============================================================
// TYPES
// ============================================================

interface ScheduledTask {
  name: string;
  schedule: string;
  description: string;
  running: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

// ============================================================
// SCHEDULED TASKS REGISTRY
// ============================================================

const scheduledTasks: Map<string, ScheduledTask> = new Map();

// ============================================================
// TASK IMPLEMENTATIONS
// ============================================================

/**
 * Send daily summary notifications to all active users
 * Runs every day at 8:00 AM
 */
async function sendDailySummaries(): Promise<void> {
  logger.info('Running daily summary task...');

  try {
    // Get all companies with active subscriptions
    const companies = await prisma.company.findMany({
      where: {
        actif: true,
        dateFinAbonnement: { gte: new Date() },
      },
      include: {
        users: {
          where: { actif: true },
          select: { id: true },
        },
      },
    });

    for (const company of companies) {
      for (const user of company.users) {
        try {
          // Generate daily summary for user
          const summary = await generateDailySummary(user.id, company.id);

          if (summary) {
            await sendPushToUser(user.id, summary);
          }
        } catch (error) {
          logger.error(`Failed to send daily summary to user ${user.id}:`, error);
        }
      }
    }

    logger.info(`Daily summary sent to ${companies.length} companies`);
  } catch (error) {
    logger.error('Error in daily summary task:', error);
  }
}

/**
 * Check for overdue invoices and send reminders
 * Runs every day at 9:00 AM
 */
async function checkOverdueInvoices(): Promise<void> {
  logger.info('Running overdue invoices check...');

  try {
    // Find all overdue invoices
    const overdueInvoices = await prisma.facture.findMany({
      where: {
        statut: 'EN_RETARD',
        dateEcheance: { lt: new Date() },
      },
      include: {
        client: true,
        company: {
          include: {
            users: { where: { actif: true }, select: { id: true } },
          },
        },
      },
    });

    // Group by company
    const byCompany = new Map<string, typeof overdueInvoices>();

    for (const invoice of overdueInvoices) {
      const companyId = invoice.companyId;
      if (!byCompany.has(companyId)) {
        byCompany.set(companyId, []);
      }
      byCompany.get(companyId)!.push(invoice);
    }

    // Send notifications
    for (const [companyId, invoices] of byCompany) {
      const company = invoices[0].company;

      for (const user of company.users) {
        // Count invoices by days overdue
        const urgent = invoices.filter(i => {
          const daysOverdue = Math.floor(
            (Date.now() - i.dateEcheance.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysOverdue > 30;
        });

        if (urgent.length > 0) {
          await sendPushToUser(user.id, {
            title: 'Factures critiques en retard',
            body: `${urgent.length} facture(s) ont plus de 30 jours de retard. Action requise.`,
            tag: 'overdue-critical',
            requireInteraction: true,
            data: {
              url: '/factures?statut=EN_RETARD',
              actionType: 'FACTURE',
            },
          });
        }
      }
    }

    logger.info(`Processed ${overdueInvoices.length} overdue invoices`);
  } catch (error) {
    logger.error('Error in overdue invoices check:', error);
  }
}

/**
 * Check for low stock products and send alerts
 * Runs every day at 10:00 AM
 */
async function checkStockAlerts(): Promise<void> {
  logger.info('Running stock alerts check...');

  try {
    // Get all companies
    const companies = await prisma.company.findMany({
      where: { actif: true },
      include: {
        users: { where: { actif: true }, select: { id: true } },
      },
    });

    for (const company of companies) {
      const alerts = await getStockAlerts(company.id);

      if (alerts.length > 0) {
        const ruptureCount = alerts.filter(a => a.type === 'RUPTURE').length;
        const lowStockCount = alerts.filter(a => a.type === 'STOCK_BAS').length;

        for (const user of company.users) {
          await sendPushToUser(user.id, {
            title: 'Alertes stock',
            body: `${ruptureCount} rupture(s), ${lowStockCount} stock bas. Vérifiez vos stocks.`,
            tag: 'stock-alert',
            data: {
              url: '/stock?tab=alerts',
              actionType: 'STOCK',
            },
          });
        }
      }
    }

    logger.info('Stock alerts processed');
  } catch (error) {
    logger.error('Error in stock alerts check:', error);
  }
}

/**
 * Check for expiring subscriptions and notify users
 * Runs every day at 11:00 AM
 */
async function checkExpiringSubscriptions(): Promise<void> {
  logger.info('Running expiring subscriptions check...');

  try {
    // Find subscriptions expiring in the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringCompanies = await prisma.company.findMany({
      where: {
        actif: true,
        dateFinAbonnement: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
      },
      include: {
        users: { where: { actif: true }, select: { id: true } },
        planAbonnement: true,
      },
    });

    for (const company of expiringCompanies) {
      const daysRemaining = Math.ceil(
        (company.dateFinAbonnement!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const notification = generateSubscriptionExpiring(
        company.planAbonnement?.nom || 'Standard',
        daysRemaining,
        company.dateFinAbonnement!.toLocaleDateString('fr-FR')
      );

      for (const user of company.users) {
        await sendPushToUser(user.id, notification);
      }
    }

    logger.info(`Processed ${expiringCompanies.length} expiring subscriptions`);
  } catch (error) {
    logger.error('Error in expiring subscriptions check:', error);
  }
}

/**
 * Check for expired quotes and update status
 * Runs every hour
 */
async function checkExpiredQuotes(): Promise<void> {
  logger.info('Running expired quotes check...');

  try {
    const companies = await prisma.company.findMany({
      where: { actif: true },
    });

    for (const company of companies) {
      const expiredCount = await checkExpiredDevis(company.id);
      if (expiredCount > 0) {
        logger.info(`Company ${company.id}: ${expiredCount} quotes expired`);
      }
    }
  } catch (error) {
    logger.error('Error in expired quotes check:', error);
  }
}

/**
 * Clean up old notifications and logs
 * Runs every day at midnight
 */
async function cleanupOldData(): Promise<void> {
  logger.info('Running cleanup task...');

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Delete old read notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        lu: true,
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    // Delete old SMS logs
    const deletedSms = await prisma.smsLog.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    // Delete old email logs
    const deletedEmails = await prisma.emailLog.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    logger.info(
      `Cleanup completed: ${deletedNotifications.count} notifications, ` +
      `${deletedSms.count} SMS logs, ${deletedEmails.count} email logs deleted`
    );
  } catch (error) {
    logger.error('Error in cleanup task:', error);
  }
}

/**
 * Generate monthly reports for all companies
 * Runs on the 1st of every month at 6:00 AM
 */
async function generateMonthlyReports(): Promise<void> {
  logger.info('Running monthly report generation...');

  try {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const month = lastMonth.getMonth() + 1;
    const year = lastMonth.getFullYear();

    const companies = await prisma.company.findMany({
      where: { actif: true },
      include: {
        users: {
          where: { role: 'ADMIN', actif: true },
          select: { id: true },
        },
      },
    });

    for (const company of companies) {
      // Generate monthly stats
      const [invoices, payments, expenses, payroll] = await Promise.all([
        prisma.facture.aggregate({
          where: {
            companyId: company.id,
            dateEmission: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
          _sum: { montantTTC: true },
          _count: true,
        }),
        prisma.paiement.aggregate({
          where: {
            facture: { companyId: company.id },
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
          _sum: { montant: true },
        }),
        prisma.depense.aggregate({
          where: {
            companyId: company.id,
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
          _sum: { montant: true },
        }),
        prisma.bulletinPaie.aggregate({
          where: {
            companyId: company.id,
            mois: month,
            annee: year,
          },
          _sum: { netAPayer: true },
        }),
      ]);

      // Notify admins
      for (const user of company.users) {
        await sendPushToUser(user.id, {
          title: `Rapport mensuel - ${getMonthName(month)} ${year}`,
          body: `CA: ${formatCurrency(invoices._sum.montantTTC || 0)} | ` +
            `Encaissé: ${formatCurrency(payments._sum.montant || 0)} | ` +
            `Dépenses: ${formatCurrency(expenses._sum.montant || 0)}`,
          tag: 'monthly-report',
          data: {
            url: '/rapports',
            actionType: 'REPORT',
          },
        });
      }
    }

    logger.info('Monthly reports generated');
  } catch (error) {
    logger.error('Error in monthly report generation:', error);
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getMonthName(month: number): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[month - 1];
}

function formatCurrency(amount: number | null): string {
  if (!amount) return '0 GNF';
  return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
}

// ============================================================
// CRON JOB SETUP
// ============================================================

export function initializeScheduledTasks(): void {
  logger.info('Initializing scheduled tasks...');

  // Daily summary - 8:00 AM
  cron.schedule('0 8 * * *', () => {
    sendDailySummaries();
  }, {
    timezone: 'Africa/Conakry',
  });

  // Overdue invoices check - 9:00 AM
  cron.schedule('0 9 * * *', () => {
    checkOverdueInvoices();
  }, {
    timezone: 'Africa/Conakry',
  });

  // Stock alerts - 10:00 AM
  cron.schedule('0 10 * * *', () => {
    checkStockAlerts();
  }, {
    timezone: 'Africa/Conakry',
  });

  // Expiring subscriptions - 11:00 AM
  cron.schedule('0 11 * * *', () => {
    checkExpiringSubscriptions();
  }, {
    timezone: 'Africa/Conakry',
  });

  // Expired quotes - every hour
  cron.schedule('0 * * * *', () => {
    checkExpiredQuotes();
  }, {
    timezone: 'Africa/Conakry',
  });

  // Cleanup - midnight
  cron.schedule('0 0 * * *', () => {
    cleanupOldData();
  }, {
    timezone: 'Africa/Conakry',
  });

  // Monthly reports - 1st of month at 6:00 AM
  cron.schedule('0 6 1 * *', () => {
    generateMonthlyReports();
  }, {
    timezone: 'Africa/Conakry',
  });

  // Register tasks in registry
  scheduledTasks.set('daily-summary', {
    name: 'Résumé quotidien',
    schedule: '0 8 * * *',
    description: 'Envoie un résumé quotidien aux utilisateurs actifs',
    running: false,
  });

  scheduledTasks.set('overdue-invoices', {
    name: 'Factures en retard',
    schedule: '0 9 * * *',
    description: 'Vérifie les factures en retard et envoie des rappels',
    running: false,
  });

  scheduledTasks.set('stock-alerts', {
    name: 'Alertes stock',
    schedule: '0 10 * * *',
    description: 'Vérifie les niveaux de stock et envoie des alertes',
    running: false,
  });

  scheduledTasks.set('expiring-subscriptions', {
    name: 'Abonnements expirants',
    schedule: '0 11 * * *',
    description: 'Notifie les abonnements qui expirent bientôt',
    running: false,
  });

  scheduledTasks.set('expired-quotes', {
    name: 'Devis expirés',
    schedule: '0 * * * *',
    description: 'Met à jour le statut des devis expirés',
    running: false,
  });

  scheduledTasks.set('cleanup', {
    name: 'Nettoyage',
    schedule: '0 0 * * *',
    description: 'Supprime les anciennes données',
    running: false,
  });

  scheduledTasks.set('monthly-reports', {
    name: 'Rapports mensuels',
    schedule: '0 6 1 * *',
    description: 'Génère les rapports mensuels',
    running: false,
  });

  logger.info('Scheduled tasks initialized');
}

/**
 * Get all scheduled tasks status
 */
export function getScheduledTasksStatus(): ScheduledTask[] {
  return Array.from(scheduledTasks.values());
}

/**
 * Manually trigger a scheduled task
 */
export async function triggerTask(taskName: string): Promise<{ success: boolean; error?: string }> {
  const task = scheduledTasks.get(taskName);

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  if (task.running) {
    return { success: false, error: 'Task already running' };
  }

  try {
    task.running = true;

    switch (taskName) {
      case 'daily-summary':
        await sendDailySummaries();
        break;
      case 'overdue-invoices':
        await checkOverdueInvoices();
        break;
      case 'stock-alerts':
        await checkStockAlerts();
        break;
      case 'expiring-subscriptions':
        await checkExpiringSubscriptions();
        break;
      case 'expired-quotes':
        await checkExpiredQuotes();
        break;
      case 'cleanup':
        await cleanupOldData();
        break;
      case 'monthly-reports':
        await generateMonthlyReports();
        break;
      default:
        return { success: false, error: 'Unknown task' };
    }

    task.lastRun = new Date();
    task.running = false;

    return { success: true };
  } catch (error) {
    task.running = false;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  initializeScheduledTasks,
  getScheduledTasksStatus,
  triggerTask,
};
