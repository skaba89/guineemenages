import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// VAPID configuration (optional - for push notifications)
let vapidConfigured = false;

try {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const webpush = require('web-push');
    webpush.setVapidDetails(
      'mailto:support@guineamanager.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    vapidConfigured = true;
  }
} catch (error) {
  console.warn('Push notifications not configured - VAPID keys missing');
}

// ============================================================
// NOTIFICATIONS
// ============================================================

// GET /api/notifications - Get user notifications
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { lu, type, page = 1, limit = 20 } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (lu !== undefined) where.lu = lu === 'true';
    if (type) where.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user!.id, lu: false },
      }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user!.id,
        lu: false,
      },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée',
      });
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { lu: true },
    });

    res.json({
      success: true,
      message: 'Notification marquée comme lue',
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        lu: false,
      },
      data: { lu: true },
    });

    res.json({
      success: true,
      message: 'Toutes les notifications marquées comme lues',
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée',
      });
    }

    await prisma.notification.delete({
      where: { id: notification.id },
    });

    res.json({
      success: true,
      message: 'Notification supprimée',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user!.id },
    });

    res.json({
      success: true,
      message: 'Toutes les notifications supprimées',
    });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// PUSH SUBSCRIPTIONS
// ============================================================

// GET /api/notifications/vapid-key - Get public VAPID key
router.get('/vapid-key', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      publicKey: process.env.VAPID_PUBLIC_KEY,
    },
  });
});

// POST /api/notifications/subscribe - Subscribe to push notifications
router.post('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
    });

    const data = schema.parse(req.body);

    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: data.endpoint },
    });

    if (existing) {
      // Update if belongs to current user
      if (existing.userId === req.user!.id) {
        await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: data.keys.p256dh,
            auth: data.keys.auth,
            actif: true,
          },
        });
      }
      return res.json({
        success: true,
        message: 'Abonnement mis à jour',
      });
    }

    // Create new subscription
    await prisma.pushSubscription.create({
      data: {
        userId: req.user!.id,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      success: true,
      message: 'Abonnement aux notifications activé',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/notifications/unsubscribe - Unsubscribe from push
router.post('/unsubscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint requis',
      });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: req.user!.id,
        endpoint,
      },
    });

    res.json({
      success: true,
      message: 'Abonnement désactivé',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

// GET /api/notifications/preferences - Get notification preferences
router.get('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      select: {
        notificationEmail: true,
        notificationSMS: true,
      },
    });

    res.json({
      success: true,
      data: {
        email: company?.notificationEmail ?? true,
        sms: company?.notificationSMS ?? false,
        push: true, // Default to enabled
      },
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/notifications/preferences - Update preferences
router.put('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    await prisma.company.update({
      where: { id: req.user!.companyId },
      data: {
        notificationEmail: data.email,
        notificationSMS: data.sms,
      },
    });

    // If push is disabled, deactivate all subscriptions
    if (data.push === false) {
      await prisma.pushSubscription.updateMany({
        where: { userId: req.user!.id },
        data: { actif: false },
      });
    } else if (data.push === true) {
      await prisma.pushSubscription.updateMany({
        where: { userId: req.user!.id },
        data: { actif: true },
      });
    }

    res.json({
      success: true,
      message: 'Préférences mises à jour',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Create notification helper
export async function createNotification(data: {
  userId: string;
  titre: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  actionUrl?: string;
  actionType?: string;
  actionId?: string;
}): Promise<void> {
  // Create in-app notification
  await prisma.notification.create({
    data: {
      userId: data.userId,
      titre: data.titre,
      message: data.message,
      type: data.type,
      actionUrl: data.actionUrl,
      actionType: data.actionType,
      actionId: data.actionId,
    },
  });

  // Send push notification only if configured
  if (!vapidConfigured) return;
  
  try {
    const webpush = require('web-push');
    
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: data.userId,
        actif: true,
      },
    });

    const payload = JSON.stringify({
      title: data.titre,
      body: data.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: data.actionUrl,
      },
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }, payload);
      } catch (error: any) {
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
      }
    }
  } catch (error) {
    console.error('Push notification error:', error);
  }
}

export default router;
