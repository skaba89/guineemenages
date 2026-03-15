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

  console.log('✅ Seeding terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
