// Application Express principale pour GuinéaManager

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './utils/config';
import logger from './utils/logger';

// Middlewares
import { 
  globalRateLimiter, 
  errorHandler, 
  notFoundHandler,
  loggingMiddleware 
} from './middlewares';

// Routes
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import clientRoutes from './routes/client.routes';
import produitRoutes from './routes/produit.routes';
import factureRoutes from './routes/facture.routes';
import employeRoutes from './routes/employe.routes';
import paieRoutes from './routes/paie.routes';
import depenseRoutes from './routes/depense.routes';
import rapportRoutes from './routes/rapport.routes';
import orangeMoneyRoutes from './routes/orange-money.routes';
import adminRoutes from './routes/admin.routes';
import notificationsRoutes from './routes/notifications.routes';
import stockRoutes from './routes/stock.routes';
import devisRoutes from './routes/devis.routes';
import apiDocsRoutes from './routes/api-docs.routes';
import commandesRoutes from './routes/commandes.routes';
import bonsLivraisonRoutes from './routes/bons-livraison.routes';
import comptabiliteRoutes from './routes/comptabilite.routes';
import crmRoutes from './routes/crm.routes';
import devisesRoutes from './routes/devises.routes';

// Créer l'application Express
const app = express();

// Trust proxy (pour les reverse proxies)
app.set('trust proxy', 1);

// Middlewares de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: config.nodeEnv === 'production' 
    ? [config.appUrl, 'https://app.guineamanager.com']
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(loggingMiddleware);

// Rate limiting global
app.use(globalRateLimiter);

// Route de santé
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

// Route racine
app.get('/', (_req, res) => {
  res.json({
    name: 'GuinéaManager API',
    version: '1.0.0',
    description: 'ERP SaaS pour PME guinéennes',
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      clients: '/api/clients',
      produits: '/api/produits',
      factures: '/api/factures',
      employes: '/api/employes',
      paie: '/api/paie',
      depenses: '/api/depenses',
      rapports: '/api/rapports',
      paiements: '/api/paiements-mobile',
      admin: '/api/admin',
    },
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/employes', employeRoutes);
app.use('/api/paie', paieRoutes);
app.use('/api/depenses', depenseRoutes);
app.use('/api/rapports', rapportRoutes);
app.use('/api/paiements-mobile', orangeMoneyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/bons-livraison', bonsLivraisonRoutes);
app.use('/api/docs', apiDocsRoutes);
app.use('/api/comptabilite', comptabiliteRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/devises', devisesRoutes);

// Gestion des erreurs
app.use(notFoundHandler);
app.use(errorHandler);

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

export default app;
