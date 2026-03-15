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

// Routes
app.use('/api/auth', authRoutes);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
