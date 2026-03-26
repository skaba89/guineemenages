import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/clients.routes';
import produitRoutes from './routes/produits.routes';
import factureRoutes from './routes/factures.routes';
import employeRoutes from './routes/employes.routes';
import paieRoutes from './routes/paie.routes';
import depenseRoutes from './routes/depenses.routes';
import dashboardRoutes from './routes/dashboard.routes';
import exportRoutes from './routes/exports.routes';
import parametresRoutes from './routes/parametres.routes';
import plansRoutes from './routes/plans.routes';
import supportRoutes from './routes/support.routes';
import notificationsRoutes from './routes/notifications.routes';
import paymentRoutes from './routes/payment.routes';
import twoFactorRoutes from './routes/auth-2fa.routes';
import stockRoutes from './routes/stock.routes';
import devisRoutes from './routes/devis.routes';
import commandesRoutes from './routes/commandes.routes';
import fournisseursRoutes from './routes/fournisseurs.routes';
import comptabiliteRoutes from './routes/comptabilite.routes';
import crmRoutes from './routes/crm.routes';
import devisesRoutes from './routes/devises.routes';
import apiDocsRoutes from './routes/api-docs.routes';
import orangeMoneyRoutes from './routes/orange-money.routes';
import adminRoutes from './routes/admin.routes';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes principales
app.use('/api/auth', authRoutes);
app.use('/api/auth', twoFactorRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/employes', employeRoutes);
app.use('/api/paie', paieRoutes);
app.use('/api/depenses', depenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/parametres', parametresRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payments', paymentRoutes);

// Nouvelles routes (Priority 2 & 3)
app.use('/api/stock', stockRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/fournisseurs', fournisseursRoutes);
app.use('/api/comptabilite', comptabiliteRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/devises', devisesRoutes);
app.use('/api/docs', apiDocsRoutes);
app.use('/api/paiements-mobile', orangeMoneyRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'GuinéaManager API',
    version: '1.0.0',
    description: 'ERP SaaS pour PME ouest-africaines',
    endpoints: {
      auth: '/api/auth',
      clients: '/api/clients',
      produits: '/api/produits',
      factures: '/api/factures',
      employes: '/api/employes',
      paie: '/api/paie',
      depenses: '/api/depenses',
      dashboard: '/api/dashboard',
      stock: '/api/stock',
      devis: '/api/devis',
      commandes: '/api/commandes',
      fournisseurs: '/api/fournisseurs',
      comptabilite: '/api/comptabilite',
      crm: '/api/crm',
      devises: '/api/devises',
      documentation: '/api/docs',
    }
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 GuinéaManager API running on http://localhost:${PORT}`);
});

export default app;
