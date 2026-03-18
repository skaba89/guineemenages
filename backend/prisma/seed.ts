import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // =========================================================================
  // PLANS D'ABONNEMENT
  // =========================================================================
  
  const plans = [
    {
      id: 'petite',
      nom: 'PETITE',
      description: 'Idéal pour les petites entreprises et auto-entrepreneurs. Parfait pour démarrer votre activité avec les fonctionnalités essentielles de gestion.',
      prixMensuel: 0,
      prixAnnuel: 0,
      maxEmployes: 5,
      maxUtilisateurs: 2,
      maxClients: 50,
      maxProduits: 100,
      maxFacturesMois: 30,
      modules: 'facturation,clients,produits,dashboard',
      support: 'email',
      sauvegardeAuto: true,
      apiAccess: false,
      personnalisation: false,
      multiSociete: false,
      rapportsAvances: false
    },
    {
      id: 'moyenne',
      nom: 'MOYENNE',
      description: 'Conçu pour les PME en croissance. Inclut la gestion des employés, de la paie et des rapports avancés pour une gestion complète.',
      prixMensuel: 50000_00,  // 50 000 GNF ~ 5 000 FCFA
      prixAnnuel: 500000_00,  // 500 000 GNF ~ 50 000 FCFA (2 mois gratuits)
      maxEmployes: 25,
      maxUtilisateurs: 5,
      maxClients: 200,
      maxProduits: 500,
      maxFacturesMois: 200,
      modules: 'facturation,clients,produits,employes,paie,depenses,rapports,dashboard',
      support: 'chat',
      sauvegardeAuto: true,
      apiAccess: true,
      personnalisation: true,
      multiSociete: false,
      rapportsAvances: true
    },
    {
      id: 'grande',
      nom: 'GRANDE',
      description: 'Pour les entreprises établies avec des besoins avancés. Multi-société, API complète et support prioritaire inclus.',
      prixMensuel: 150000_00,  // 150 000 GNF ~ 15 000 FCFA
      prixAnnuel: 1500000_00,  // 1 500 000 GNF ~ 150 000 FCFA
      maxEmployes: 100,
      maxUtilisateurs: 15,
      maxClients: 1000,
      maxProduits: 2000,
      maxFacturesMois: 1000,
      modules: 'facturation,clients,produits,employes,paie,depenses,rapports,parametres,dashboard',
      support: 'phone',
      sauvegardeAuto: true,
      apiAccess: true,
      personnalisation: true,
      multiSociete: true,
      rapportsAvances: true
    },
    {
      id: 'enterprise',
      nom: 'ENTERPRISE',
      description: 'Solution sur mesure pour les grandes entreprises. Support dédié, formation, et personnalisations avancées.',
      prixMensuel: 500000_00,  // 500 000 GNF ~ 50 000 FCFA
      prixAnnuel: 5000000_00,  // 5 000 000 GNF ~ 500 000 FCFA
      maxEmployes: -1,  // Illimité
      maxUtilisateurs: -1,
      maxClients: -1,
      maxProduits: -1,
      maxFacturesMois: -1,
      modules: 'all',
      support: 'dedicated',
      sauvegardeAuto: true,
      apiAccess: true,
      personnalisation: true,
      multiSociete: true,
      rapportsAvances: true
    }
  ];

  console.log('📦 Création des plans d\'abonnement...');
  for (const plan of plans) {
    await prisma.planAbonnement.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan
    });
    console.log(`   ✓ Plan ${plan.nom} créé/mis à jour`);
  }

  // =========================================================================
  // CATÉGORIES DE DÉPENSES PAR DÉFAUT
  // =========================================================================
  
  console.log('📂 Création des catégories de dépenses...');
  const categoriesDepenses = [
    { nom: 'Loyer & Charges', description: 'Loyer, électricité, eau, internet', couleur: '#3B82F6', icone: 'home' },
    { nom: 'Salaires & Charges', description: 'Salaires, primes, cotisations sociales', couleur: '#10B981', icone: 'users' },
    { nom: 'Achats & Fournitures', description: 'Matériel, fournitures de bureau', couleur: '#F59E0B', icone: 'shopping-cart' },
    { nom: 'Services & Prestations', description: 'Services externes, consultants', couleur: '#8B5CF6', icone: 'briefcase' },
    { nom: 'Transport & Déplacements', description: 'Carburant, taxis, voyages professionnels', couleur: '#EF4444', icone: 'truck' },
    { nom: 'Communication & Publicité', description: 'Marketing, publicité, communication', couleur: '#EC4899', icone: 'megaphone' },
    { nom: 'Impôts & Taxes', description: 'Impôts, taxes, licences', couleur: '#6366F1', icone: 'receipt' },
    { nom: 'Formation', description: 'Formations, séminaires', couleur: '#14B8A6', icone: 'academic-cap' },
    { nom: 'Maintenance', description: 'Réparations, entretien', couleur: '#F97316', icone: 'tool' },
    { nom: 'Autres', description: 'Dépenses diverses', couleur: '#6B7280', icone: 'dots-horizontal' }
  ];

  // Note: Les catégories sont créées par société, donc on ne les crée pas globalement ici

  // =========================================================================
  // PARAMÈTRES PAR DÉFAUT POUR LA GUINÉE
  // =========================================================================
  
  console.log('⚙️ Configuration des paramètres par défaut...');
  // Ces paramètres seront appliqués lors de la création d'une société

  // =========================================================================
  // UTILISATEUR DE DÉMONSTRATION
  // =========================================================================
  
  console.log('👤 Création de l\'utilisateur de démonstration...');
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  // Créer une société de démo
  const demoCompany = await prisma.company.upsert({
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
  console.log('   ✓ Société demo créée');

  // Créer l'utilisateur admin de démo
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
      companyId: demoCompany.id,
      emailVerifie: true
    }
  });
  console.log('   ✓ Utilisateur demo créé (demo@guineamanager.com / demo123)');

  // Ajouter quelques clients de démo
  const demoClients = [
    { nom: 'Amadou Diallo', email: 'amadou@email.com', telephone: '+224 620 01 01 01', ville: 'Conakry' },
    { nom: 'Fatou Soumah', email: 'fatou@email.com', telephone: '+224 621 02 02 02', ville: 'Kankan' },
    { nom: 'Mamadou Sylla', email: 'mamadou@email.com', telephone: '+224 622 03 03 03', ville: 'Nzérékoré' },
    { nom: 'Aminata Touré', email: 'aminata@email.com', telephone: '+224 623 04 04 04', ville: 'Labé' },
    { nom: 'Ibrahima Condé', email: 'ibrahima@email.com', telephone: '+224 624 05 05 05', ville: 'Kindia' }
  ];

  console.log('👥 Création des clients de démonstration...');
  for (const client of demoClients) {
    await prisma.client.create({
      data: {
        ...client,
        type: 'PARTICULIER',
        pays: 'Guinée',
        companyId: demoCompany.id
      }
    });
  }
  console.log(`   ✓ ${demoClients.length} clients créés`);

  // Ajouter quelques produits de démo
  const demoProduits = [
    { nom: 'Consultation', description: 'Service de consultation', prixUnitaire: 500000, unite: 'Heure', type: 'SERVICE' },
    { nom: 'Formation', description: 'Formation professionnelle', prixUnitaire: 1500000, unite: 'Session', type: 'SERVICE' },
    { nom: 'Fournitures de bureau', description: 'Fournitures diverses', prixUnitaire: 150000, unite: 'Lot', type: 'PRODUIT' },
    { nom: 'Maintenance informatique', description: 'Service de maintenance', prixUnitaire: 300000, unite: 'Intervention', type: 'SERVICE' },
    { nom: 'Développement web', description: 'Service de développement', prixUnitaire: 5000000, unite: 'Projet', type: 'SERVICE' }
  ];

  console.log('📦 Création des produits de démonstration...');
  for (const produit of demoProduits) {
    await prisma.produit.create({
      data: {
        ...produit,
        stockActuel: produit.type === 'PRODUIT' ? 100 : 0,
        companyId: demoCompany.id
      }
    });
  }
  console.log(`   ✓ ${demoProduits.length} produits créés`);

  // Ajouter quelques employés de démo
  const demoEmployes = [
    { matricule: 'EMP001', nom: 'Diallo', prenom: 'Moussa', poste: 'Comptable', departement: 'Finance', salaireBase: 3000000 },
    { matricule: 'EMP002', nom: 'Soumah', prenom: 'Aïssatou', poste: 'Secrétaire', departement: 'Administration', salaireBase: 2000000 },
    { matricule: 'EMP003', nom: 'Sylla', prenom: 'Alpha', poste: 'Commercial', departement: 'Ventes', salaireBase: 2500000 },
    { matricule: 'EMP004', nom: 'Touré', prenom: 'Mariama', poste: 'RH', departement: 'Ressources Humaines', salaireBase: 2800000 },
    { matricule: 'EMP005', nom: 'Condé', prenom: 'Sékou', poste: 'Développeur', departement: 'IT', salaireBase: 4000000 }
  ];

  console.log('👷 Création des employés de démonstration...');
  for (const employe of demoEmployes) {
    await prisma.employe.create({
      data: {
        ...employe,
        email: `${employe.prenom.toLowerCase()}.${employe.nom.toLowerCase()}@demo.com`,
        dateEmbauche: new Date(2023, 0, 1),
        typeContrat: 'CDI',
        nombrePartsFiscales: 2,
        companyId: demoCompany.id
      }
    });
  }
  console.log(`   ✓ ${demoEmployes.length} employés créés`);

  console.log('✅ Seeding terminé avec succès!');
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('🔑 IDENTIFIANTS DE CONNEXION:');
  console.log('   Email: demo@guineamanager.com');
  console.log('   Mot de passe: demo123');
  console.log('════════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
