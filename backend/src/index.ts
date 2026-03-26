// Backend entry point - uses the complete Express app
import app from './app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

// Initialize database on first run
async function initializeDatabase() {
  try {
    // Check if database has any users
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('🔧 First run detected - initializing database...');
      
      // Create subscription plans
      const plans = [
        { id: 'petite', nom: 'PETITE', description: 'Idéal pour les petites entreprises', prixMensuel: 0, prixAnnuel: 0, maxEmployes: 5, maxUtilisateurs: 2, maxClients: 50, maxProduits: 100, maxFacturesMois: 30, modules: 'facturation,clients,produits,dashboard', support: 'email', sauvegardeAuto: true, apiAccess: false, personnalisation: false, multiSociete: false, rapportsAvances: false },
        { id: 'moyenne', nom: 'MOYENNE', description: 'Conçu pour les PME en croissance', prixMensuel: 50000_00, prixAnnuel: 500000_00, maxEmployes: 25, maxUtilisateurs: 5, maxClients: 200, maxProduits: 500, maxFacturesMois: 200, modules: 'facturation,clients,produits,employes,paie,depenses,rapports,dashboard', support: 'chat', sauvegardeAuto: true, apiAccess: true, personnalisation: true, multiSociete: false, rapportsAvances: true },
        { id: 'grande', nom: 'GRANDE', description: 'Pour les entreprises établies', prixMensuel: 150000_00, prixAnnuel: 1500000_00, maxEmployes: 100, maxUtilisateurs: 15, maxClients: 1000, maxProduits: 2000, maxFacturesMois: 1000, modules: 'facturation,clients,produits,employes,paie,depenses,rapports,parametres,dashboard', support: 'phone', sauvegardeAuto: true, apiAccess: true, personnalisation: true, multiSociete: true, rapportsAvances: true },
        { id: 'enterprise', nom: 'ENTERPRISE', description: 'Solution sur mesure', prixMensuel: 500000_00, prixAnnuel: 5000000_00, maxEmployes: -1, maxUtilisateurs: -1, maxClients: -1, maxProduits: -1, maxFacturesMois: -1, modules: 'all', support: 'dedicated', sauvegardeAuto: true, apiAccess: true, personnalisation: true, multiSociete: true, rapportsAvances: true }
      ];

      for (const plan of plans) {
        await prisma.planAbonnement.upsert({
          where: { id: plan.id },
          update: plan,
          create: plan
        });
      }
      console.log('  ✓ Plans d\'abonnement créés');

      // Create demo company
      const company = await prisma.company.upsert({
        where: { id: 'demo-company-001' },
        update: {},
        create: {
          id: 'demo-company-001',
          nom: 'Entreprise Demo SARL',
          email: 'demo@guineamanager.com',
          telephone: '+224 624 00 00 00',
          adresse: 'Conakry, Guinée',
          ville: 'Conakry',
          pays: 'Guinée',
          codePays: 'GN',
          devise: 'GNF',
          symboleDevise: 'GNF',
          planId: 'moyenne',
          dateDebutAbonnement: new Date(),
          dateFinAbonnement: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      });
      console.log('  ✓ Société de démo créée');

      // Create demo user
      const hashedPassword = await bcrypt.hash('demo123', 10);
      await prisma.user.upsert({
        where: { email: 'demo@guineamanager.com' },
        update: {},
        create: {
          id: 'demo-user-001',
          email: 'demo@guineamanager.com',
          password: hashedPassword,
          nom: 'Demo',
          prenom: 'Admin',
          telephone: '+224 624 00 00 00',
          role: 'ADMIN',
          companyId: company.id,
          emailVerifie: true
        }
      });
      console.log('  ✓ Utilisateur de démo créé');

      console.log('');
      console.log('════════════════════════════════════════════════════════════');
      console.log('✅ BASE DE DONNÉES INITIALISÉE!');
      console.log('🔑 Identifiants de connexion:');
      console.log('   Email: demo@guineamanager.com');
      console.log('   Mot de passe: demo123');
      console.log('════════════════════════════════════════════════════════════');
      console.log('');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Start server
async function start() {
  try {
    await prisma.$connect();
    console.log('📊 Database connected');
    
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 GuinéaManager API running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

start();

export default app;
