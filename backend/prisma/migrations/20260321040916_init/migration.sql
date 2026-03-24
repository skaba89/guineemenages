-- CreateTable
CREATE TABLE "PlanAbonnement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prixMensuel" INTEGER NOT NULL DEFAULT 0,
    "prixAnnuel" INTEGER NOT NULL DEFAULT 0,
    "maxEmployes" INTEGER NOT NULL DEFAULT 5,
    "maxUtilisateurs" INTEGER NOT NULL DEFAULT 2,
    "maxClients" INTEGER NOT NULL DEFAULT 50,
    "maxProduits" INTEGER NOT NULL DEFAULT 100,
    "maxFacturesMois" INTEGER NOT NULL DEFAULT 50,
    "modules" TEXT NOT NULL DEFAULT 'facturation,clients,produits',
    "support" TEXT NOT NULL DEFAULT 'email',
    "sauvegardeAuto" BOOLEAN NOT NULL DEFAULT true,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "personnalisation" BOOLEAN NOT NULL DEFAULT false,
    "multiSociete" BOOLEAN NOT NULL DEFAULT false,
    "rapportsAvances" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'Guinée',
    "codePays" TEXT NOT NULL DEFAULT 'GN',
    "ninea" TEXT,
    "logo" TEXT,
    "devise" TEXT NOT NULL DEFAULT 'GNF',
    "symboleDevise" TEXT NOT NULL DEFAULT 'GNF',
    "planId" TEXT DEFAULT 'free',
    "dateDebutAbonnement" DATETIME,
    "dateFinAbonnement" DATETIME,
    "configTauxCNSSEmploye" REAL,
    "configTauxCNSSEmployeur" REAL,
    "configPlafondCNSS" INTEGER,
    "configTauxTVA" REAL DEFAULT 0.18,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "fuseauHoraire" TEXT NOT NULL DEFAULT 'Africa/Conakry',
    "formatDateTime" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "notificationEmail" BOOLEAN NOT NULL DEFAULT true,
    "notificationSMS" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateEssaiFin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanAbonnement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParametreSociete" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParametreSociete_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoriqueAbonnement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planNom" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME,
    "prix" INTEGER NOT NULL,
    "modePaiement" TEXT,
    "referencePaiement" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoriqueAbonnement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'COMPTABLE',
    "companyId" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifie" BOOLEAN NOT NULL DEFAULT false,
    "dernierLogin" DATETIME,
    "preferences" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorMethod" TEXT,
    "twoFactorSecret" TEXT,
    "twoFactorOTP" TEXT,
    "twoFactorOTPExpiry" DATETIME,
    "twoFactorRecoveryCodes" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "verificationToken" TEXT,
    "verificationTokenExpiry" DATETIME,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'Guinée',
    "type" TEXT NOT NULL DEFAULT 'PARTICULIER',
    "ninea" TEXT,
    "totalAchats" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Produit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "prixUnitaire" INTEGER NOT NULL,
    "unite" TEXT NOT NULL DEFAULT 'Unité',
    "stockActuel" INTEGER NOT NULL DEFAULT 0,
    "stockMin" INTEGER NOT NULL DEFAULT 0,
    "stockMax" INTEGER,
    "categorie" TEXT,
    "tva" REAL DEFAULT 0.18,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'PRODUIT',
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Produit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dateEmission" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" DATETIME NOT NULL,
    "montantHT" INTEGER NOT NULL,
    "montantTVA" INTEGER NOT NULL,
    "montantTTC" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "modePaiement" TEXT,
    "notes" TEXT,
    "conditions" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Facture_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Facture_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneFacture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factureId" TEXT NOT NULL,
    "produitId" TEXT,
    "description" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" INTEGER NOT NULL,
    "tauxTVA" REAL NOT NULL DEFAULT 0.18,
    "montantHT" INTEGER NOT NULL,
    "montantTVA" INTEGER NOT NULL,
    "montantTTC" INTEGER NOT NULL,
    CONSTRAINT "LigneFacture_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneFacture_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factureId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL,
    "reference" TEXT,
    "referenceMobile" TEXT,
    "orangeTransactionId" TEXT,
    "mtnTransactionId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Paiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "dateNaissance" DATETIME,
    "lieuNaissance" TEXT,
    "nationalite" TEXT,
    "situationMatrimoniale" TEXT,
    "nombreEnfants" INTEGER NOT NULL DEFAULT 0,
    "dateEmbauche" DATETIME NOT NULL,
    "dateDepart" DATETIME,
    "motifDepart" TEXT,
    "poste" TEXT NOT NULL,
    "departement" TEXT,
    "salaireBase" INTEGER NOT NULL,
    "typeContrat" TEXT NOT NULL DEFAULT 'CDI',
    "dureeContratMois" INTEGER,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "photo" TEXT,
    "numeroCNSS" TEXT,
    "nombrePartsFiscales" INTEGER NOT NULL DEFAULT 1,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employe_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "nombreJours" INTEGER NOT NULL,
    "motif" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "approuvePar" TEXT,
    "dateApprobation" DATETIME,
    "commentaire" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conge_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BulletinPaie" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeId" TEXT NOT NULL,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "periodePaiement" TEXT,
    "salaireBase" INTEGER NOT NULL,
    "heuresSupplementaires" INTEGER NOT NULL DEFAULT 0,
    "tauxHoraireSupp" INTEGER NOT NULL DEFAULT 0,
    "montantHeuresSupp" INTEGER NOT NULL DEFAULT 0,
    "primes" INTEGER NOT NULL DEFAULT 0,
    "primesDetail" TEXT,
    "indemnites" INTEGER NOT NULL DEFAULT 0,
    "indemnitesDetail" TEXT,
    "autresAvantages" INTEGER NOT NULL DEFAULT 0,
    "brutTotal" INTEGER NOT NULL,
    "baseCNSS" INTEGER NOT NULL,
    "cnssEmploye" INTEGER NOT NULL,
    "cnssEmployeur" INTEGER NOT NULL,
    "baseImposable" INTEGER NOT NULL,
    "ipr" INTEGER NOT NULL,
    "autresRetenues" INTEGER NOT NULL DEFAULT 0,
    "acomptes" INTEGER NOT NULL DEFAULT 0,
    "totalRetenues" INTEGER NOT NULL,
    "netAPayer" INTEGER NOT NULL,
    "netImposable" INTEGER NOT NULL,
    "coutTotalEmployeur" INTEGER NOT NULL,
    "taxesAdditionnelles" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "datePaiement" DATETIME,
    "modePaiement" TEXT,
    "referencePaiement" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BulletinPaie_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BulletinPaie_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Depense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "categorie" TEXT NOT NULL,
    "sousCategorie" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" TEXT NOT NULL,
    "beneficiaire" TEXT,
    "notes" TEXT,
    "recuUrl" TEXT,
    "valide" BOOLEAN NOT NULL DEFAULT false,
    "validePar" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Depense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategorieDepense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "couleur" TEXT,
    "icone" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "table" TEXT NOT NULL,
    "recordId" TEXT,
    "userId" TEXT,
    "companyId" TEXT,
    "details" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "actionType" TEXT,
    "actionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SmsLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telephone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "erreur" TEXT,
    "cout" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "destinataire" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT,
    "statut" TEXT NOT NULL,
    "erreur" TEXT,
    "templateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TachePlanifiee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "cronExpression" TEXT,
    "prochaineExec" DATETIME,
    "derniereExec" DATETIME,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "configuration" TEXT,
    "derniereErreur" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sujet" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priorite" TEXT NOT NULL DEFAULT 'NORMALE',
    "statut" TEXT NOT NULL DEFAULT 'OUVERT',
    "categorie" TEXT NOT NULL DEFAULT 'AUTRE',
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "piecesJointes" TEXT,
    "satisfaction" INTEGER,
    "commentaire" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resoluAt" DATETIME,
    "fermeAt" DATETIME,
    CONSTRAINT "SupportTicket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupportTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TicketReponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "auteurType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "piecesJointes" TEXT,
    "interne" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketReponse_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaiementAbonnement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'GNF',
    "methode" TEXT NOT NULL,
    "reference" TEXT,
    "numeroTelephone" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "detailsReponse" TEXT,
    "planId" TEXT NOT NULL,
    "planNom" TEXT NOT NULL,
    "duree" TEXT NOT NULL,
    "factureUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteAt" DATETIME,
    CONSTRAINT "PaiementAbonnement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dateEmission" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidite" DATETIME NOT NULL,
    "montantHT" INTEGER NOT NULL,
    "montantTVA" INTEGER NOT NULL,
    "montantTTC" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "conditions" TEXT,
    "notes" TEXT,
    "companyId" TEXT NOT NULL,
    "factureId" TEXT,
    "opportuniteId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Devis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Devis_opportuniteId_fkey" FOREIGN KEY ("opportuniteId") REFERENCES "Opportunite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneDevis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "devisId" TEXT NOT NULL,
    "produitId" TEXT,
    "description" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" INTEGER NOT NULL,
    "tauxTVA" REAL NOT NULL DEFAULT 0.18,
    "montantHT" INTEGER NOT NULL,
    "montantTVA" INTEGER NOT NULL,
    "montantTTC" INTEGER NOT NULL,
    CONSTRAINT "LigneDevis_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneDevis_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrangeMoneyAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "merchantCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrangeMoneyTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orangeTxId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GNF',
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "metadata" TEXT,
    "expiresAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MtnMoneyAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "subscriberKey" TEXT NOT NULL,
    "subscriptionKey" TEXT NOT NULL,
    "apiKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MtnMoneyTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "mtnTxId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GNF',
    "phoneNumber" TEXT NOT NULL,
    "payerMessage" TEXT,
    "payeeNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "metadata" TEXT,
    "expiresAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "invoiceCreated" BOOLEAN NOT NULL DEFAULT true,
    "invoicePaid" BOOLEAN NOT NULL DEFAULT true,
    "invoiceReminder" BOOLEAN NOT NULL DEFAULT true,
    "payrollReady" BOOLEAN NOT NULL DEFAULT true,
    "employeeHired" BOOLEAN NOT NULL DEFAULT true,
    "stockAlert" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionExpiring" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Entrepot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "code" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "telephone" TEXT,
    "responsable" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "parDefaut" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Entrepot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockEntrepot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entrepotId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "emplacement" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockEntrepot_entrepotId_fkey" FOREIGN KEY ("entrepotId") REFERENCES "Entrepot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockEntrepot_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransfertStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "entrepotSourceId" TEXT NOT NULL,
    "entrepotDestId" TEXT NOT NULL,
    "dateTransfert" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransfertStock_entrepotSourceId_fkey" FOREIGN KEY ("entrepotSourceId") REFERENCES "Entrepot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransfertStock_entrepotDestId_fkey" FOREIGN KEY ("entrepotDestId") REFERENCES "Entrepot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransfertStock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneTransfert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transfertId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LigneTransfert_transfertId_fkey" FOREIGN KEY ("transfertId") REFERENCES "TransfertStock" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneTransfert_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fournisseur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'Guinée',
    "ninea" TEXT,
    "contactNom" TEXT,
    "contactTel" TEXT,
    "notes" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fournisseur_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommandeFournisseur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "dateCommande" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateLivraisonPrevue" DATETIME,
    "dateLivraison" DATETIME,
    "montantHT" INTEGER NOT NULL,
    "montantTVA" INTEGER NOT NULL DEFAULT 0,
    "montantTTC" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "modePaiement" TEXT,
    "notes" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommandeFournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommandeFournisseur_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneCommandeFournisseur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commandeId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "description" TEXT,
    "quantite" INTEGER NOT NULL,
    "quantiteRecue" INTEGER NOT NULL DEFAULT 0,
    "prixUnitaire" INTEGER NOT NULL,
    "montantHT" INTEGER NOT NULL,
    "recu" BOOLEAN NOT NULL DEFAULT false,
    "dateReception" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LigneCommandeFournisseur_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "CommandeFournisseur" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneCommandeFournisseur_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "entrepotId" TEXT,
    "notes" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventaire_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneInventaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventaireId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "stockTheorique" INTEGER NOT NULL,
    "stockReel" INTEGER NOT NULL,
    "ecart" INTEGER NOT NULL,
    "prixUnitaire" INTEGER NOT NULL,
    "valeurEcart" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LigneInventaire_inventaireId_fkey" FOREIGN KEY ("inventaireId") REFERENCES "Inventaire" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneInventaire_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommandeClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dateCommande" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateLivraison" DATETIME,
    "montantHT" INTEGER NOT NULL,
    "montantTVA" INTEGER NOT NULL DEFAULT 0,
    "montantTTC" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "adresseLivraison" TEXT,
    "notes" TEXT,
    "devisId" TEXT,
    "companyId" TEXT NOT NULL,
    "factureId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommandeClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommandeClient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneCommandeClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commandeId" TEXT NOT NULL,
    "produitId" TEXT,
    "description" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "quantiteLivree" INTEGER NOT NULL DEFAULT 0,
    "prixUnitaire" INTEGER NOT NULL,
    "tauxTVA" REAL NOT NULL DEFAULT 0.18,
    "montantHT" INTEGER NOT NULL,
    "montantTVA" INTEGER NOT NULL DEFAULT 0,
    "montantTTC" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LigneCommandeClient_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "CommandeClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneCommandeClient_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonLivraison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "adresse" TEXT,
    "notes" TEXT,
    "signature" TEXT,
    "nomSignataire" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BonLivraison_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "CommandeClient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BonLivraison_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneBonLivraison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bonLivraisonId" TEXT NOT NULL,
    "produitId" TEXT,
    "description" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LigneBonLivraison_bonLivraisonId_fkey" FOREIGN KEY ("bonLivraisonId") REFERENCES "BonLivraison" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneBonLivraison_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanComptableOHADA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "classe" INTEGER NOT NULL,
    "sousClasse" TEXT,
    "categorie" TEXT,
    "type" TEXT NOT NULL DEFAULT 'COMPTE',
    "parent" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExerciceComptable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'OUVERT',
    "dateCloture" DATETIME,
    "cluturePar" TEXT,
    "resultatNet" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExerciceComptable_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalComptable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "compteContrepartie" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JournalComptable_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EcritureComptable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "numeroPiece" TEXT NOT NULL,
    "dateEcriture" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compteNumero" TEXT NOT NULL,
    "compteIntitule" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "reference" TEXT,
    "debit" INTEGER NOT NULL DEFAULT 0,
    "credit" INTEGER NOT NULL DEFAULT 0,
    "solde" INTEGER NOT NULL DEFAULT 0,
    "lettrage" TEXT,
    "dateLettrage" DATETIME,
    "tiersType" TEXT,
    "tiersId" TEXT,
    "tiersNom" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "valide" BOOLEAN NOT NULL DEFAULT false,
    "validePar" TEXT,
    "dateValidation" DATETIME,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EcritureComptable_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "JournalComptable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EcritureComptable_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "ExerciceComptable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SoldeCompte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "compteNumero" TEXT NOT NULL,
    "compteIntitule" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "debitInitial" INTEGER NOT NULL DEFAULT 0,
    "creditInitial" INTEGER NOT NULL DEFAULT 0,
    "debitMouvement" INTEGER NOT NULL DEFAULT 0,
    "creditMouvement" INTEGER NOT NULL DEFAULT 0,
    "debitFinal" INTEGER NOT NULL DEFAULT 0,
    "creditFinal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SoldeCompte_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SoldeCompte_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "ExerciceComptable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneBilan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "rubrique" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "montantBrut" INTEGER NOT NULL DEFAULT 0,
    "amortissement" INTEGER NOT NULL DEFAULT 0,
    "provisions" INTEGER NOT NULL DEFAULT 0,
    "montantNet" INTEGER NOT NULL DEFAULT 0,
    "montantPrecedent" INTEGER NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "niveau" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LigneBilan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LigneBilan_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "ExerciceComptable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneCompteResultat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "rubrique" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" INTEGER NOT NULL DEFAULT 0,
    "montantPrecedent" INTEGER NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "niveau" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LigneCompteResultat_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LigneCompteResultat_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "ExerciceComptable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Devise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "symbole" TEXT NOT NULL,
    "pays" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TauxChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviseSourceId" TEXT NOT NULL,
    "deviseCibleId" TEXT NOT NULL,
    "taux" REAL NOT NULL,
    "dateEffet" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TauxChange_deviseSourceId_fkey" FOREIGN KEY ("deviseSourceId") REFERENCES "Devise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TauxChange_deviseCibleId_fkey" FOREIGN KEY ("deviseCibleId") REFERENCES "Devise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversionDevise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "deviseSource" TEXT NOT NULL,
    "deviseCible" TEXT NOT NULL,
    "tauxApplique" REAL NOT NULL,
    "montantConverti" INTEGER NOT NULL,
    "dateConversion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "referenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversionDevise_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "entreprise" TEXT,
    "poste" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'Guinée',
    "source" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'NOUVEAU',
    "score" INTEGER NOT NULL DEFAULT 0,
    "budget" INTEGER,
    "notes" TEXT,
    "tags" TEXT,
    "assigneA" TEXT,
    "dateContact" DATETIME,
    "dateQualif" DATETIME,
    "dernierContact" DATETIME,
    "prochaineAction" DATETIME,
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prospect_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prospect_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opportunite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "montant" INTEGER NOT NULL DEFAULT 0,
    "probabilite" INTEGER NOT NULL DEFAULT 0,
    "etape" TEXT NOT NULL DEFAULT 'PROSPECTION',
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "source" TEXT,
    "dateCloturePrevue" DATETIME,
    "dateCloture" DATETIME,
    "raisonPerte" TEXT,
    "concurrent" TEXT,
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Opportunite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opportunite_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opportunite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActiviteCRM" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "prospectId" TEXT,
    "opportuniteId" TEXT,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'PLANIFIE',
    "priorite" TEXT NOT NULL DEFAULT 'NORMALE',
    "resultat" TEXT,
    "duree" INTEGER,
    "assigneA" TEXT,
    "creePar" TEXT,
    "rappel" BOOLEAN NOT NULL DEFAULT false,
    "dateRappel" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActiviteCRM_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActiviteCRM_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActiviteCRM_opportuniteId_fkey" FOREIGN KEY ("opportuniteId") REFERENCES "Opportunite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PipelineVente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PipelineVente_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EtapePipeline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pipelineId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "probabilite" INTEGER NOT NULL DEFAULT 0,
    "couleur" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EtapePipeline_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "PipelineVente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Company_pays_idx" ON "Company"("pays");

-- CreateIndex
CREATE INDEX "Company_planId_idx" ON "Company"("planId");

-- CreateIndex
CREATE INDEX "ParametreSociete_companyId_idx" ON "ParametreSociete"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ParametreSociete_companyId_cle_key" ON "ParametreSociete"("companyId", "cle");

-- CreateIndex
CREATE INDEX "HistoriqueAbonnement_companyId_idx" ON "HistoriqueAbonnement"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Client_companyId_idx" ON "Client"("companyId");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Produit_companyId_idx" ON "Produit"("companyId");

-- CreateIndex
CREATE INDEX "Produit_categorie_idx" ON "Produit"("categorie");

-- CreateIndex
CREATE INDEX "Facture_companyId_idx" ON "Facture"("companyId");

-- CreateIndex
CREATE INDEX "Facture_statut_idx" ON "Facture"("statut");

-- CreateIndex
CREATE INDEX "Facture_dateEmission_idx" ON "Facture"("dateEmission");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_numero_companyId_key" ON "Facture"("numero", "companyId");

-- CreateIndex
CREATE INDEX "LigneFacture_factureId_idx" ON "LigneFacture"("factureId");

-- CreateIndex
CREATE INDEX "LigneFacture_produitId_idx" ON "LigneFacture"("produitId");

-- CreateIndex
CREATE INDEX "Paiement_factureId_idx" ON "Paiement"("factureId");

-- CreateIndex
CREATE INDEX "Employe_companyId_idx" ON "Employe"("companyId");

-- CreateIndex
CREATE INDEX "Employe_departement_idx" ON "Employe"("departement");

-- CreateIndex
CREATE UNIQUE INDEX "Employe_matricule_companyId_key" ON "Employe"("matricule", "companyId");

-- CreateIndex
CREATE INDEX "Conge_employeId_idx" ON "Conge"("employeId");

-- CreateIndex
CREATE INDEX "Conge_statut_idx" ON "Conge"("statut");

-- CreateIndex
CREATE INDEX "BulletinPaie_companyId_idx" ON "BulletinPaie"("companyId");

-- CreateIndex
CREATE INDEX "BulletinPaie_statut_idx" ON "BulletinPaie"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "BulletinPaie_employeId_mois_annee_key" ON "BulletinPaie"("employeId", "mois", "annee");

-- CreateIndex
CREATE INDEX "Depense_companyId_idx" ON "Depense"("companyId");

-- CreateIndex
CREATE INDEX "Depense_categorie_idx" ON "Depense"("categorie");

-- CreateIndex
CREATE INDEX "Depense_date_idx" ON "Depense"("date");

-- CreateIndex
CREATE INDEX "CategorieDepense_companyId_idx" ON "CategorieDepense"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CategorieDepense_nom_companyId_key" ON "CategorieDepense"("nom", "companyId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_lu_idx" ON "Notification"("lu");

-- CreateIndex
CREATE INDEX "SmsLog_telephone_idx" ON "SmsLog"("telephone");

-- CreateIndex
CREATE INDEX "SmsLog_createdAt_idx" ON "SmsLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_destinataire_idx" ON "EmailLog"("destinataire");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "TachePlanifiee_type_idx" ON "TachePlanifiee"("type");

-- CreateIndex
CREATE INDEX "TachePlanifiee_prochaineExec_idx" ON "TachePlanifiee"("prochaineExec");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_companyId_idx" ON "SupportTicket"("companyId");

-- CreateIndex
CREATE INDEX "SupportTicket_statut_idx" ON "SupportTicket"("statut");

-- CreateIndex
CREATE INDEX "SupportTicket_priorite_idx" ON "SupportTicket"("priorite");

-- CreateIndex
CREATE INDEX "TicketReponse_ticketId_idx" ON "TicketReponse"("ticketId");

-- CreateIndex
CREATE INDEX "PaiementAbonnement_companyId_idx" ON "PaiementAbonnement"("companyId");

-- CreateIndex
CREATE INDEX "PaiementAbonnement_statut_idx" ON "PaiementAbonnement"("statut");

-- CreateIndex
CREATE INDEX "PaiementAbonnement_createdAt_idx" ON "PaiementAbonnement"("createdAt");

-- CreateIndex
CREATE INDEX "Devis_companyId_idx" ON "Devis"("companyId");

-- CreateIndex
CREATE INDEX "Devis_statut_idx" ON "Devis"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_numero_companyId_key" ON "Devis"("numero", "companyId");

-- CreateIndex
CREATE INDEX "LigneDevis_devisId_idx" ON "LigneDevis"("devisId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "OrangeMoneyAccount_companyId_idx" ON "OrangeMoneyAccount"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "OrangeMoneyTransaction_orderId_key" ON "OrangeMoneyTransaction"("orderId");

-- CreateIndex
CREATE INDEX "OrangeMoneyTransaction_companyId_idx" ON "OrangeMoneyTransaction"("companyId");

-- CreateIndex
CREATE INDEX "OrangeMoneyTransaction_status_idx" ON "OrangeMoneyTransaction"("status");

-- CreateIndex
CREATE INDEX "OrangeMoneyTransaction_createdAt_idx" ON "OrangeMoneyTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "MtnMoneyAccount_companyId_idx" ON "MtnMoneyAccount"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "MtnMoneyTransaction_reference_key" ON "MtnMoneyTransaction"("reference");

-- CreateIndex
CREATE INDEX "MtnMoneyTransaction_companyId_idx" ON "MtnMoneyTransaction"("companyId");

-- CreateIndex
CREATE INDEX "MtnMoneyTransaction_status_idx" ON "MtnMoneyTransaction"("status");

-- CreateIndex
CREATE INDEX "MtnMoneyTransaction_createdAt_idx" ON "MtnMoneyTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationSettings_companyId_idx" ON "NotificationSettings"("companyId");

-- CreateIndex
CREATE INDEX "Entrepot_companyId_idx" ON "Entrepot"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Entrepot_nom_companyId_key" ON "Entrepot"("nom", "companyId");

-- CreateIndex
CREATE INDEX "StockEntrepot_produitId_idx" ON "StockEntrepot"("produitId");

-- CreateIndex
CREATE INDEX "StockEntrepot_entrepotId_idx" ON "StockEntrepot"("entrepotId");

-- CreateIndex
CREATE UNIQUE INDEX "StockEntrepot_entrepotId_produitId_key" ON "StockEntrepot"("entrepotId", "produitId");

-- CreateIndex
CREATE INDEX "TransfertStock_companyId_idx" ON "TransfertStock"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TransfertStock_numero_companyId_key" ON "TransfertStock"("numero", "companyId");

-- CreateIndex
CREATE INDEX "LigneTransfert_transfertId_idx" ON "LigneTransfert"("transfertId");

-- CreateIndex
CREATE INDEX "LigneTransfert_produitId_idx" ON "LigneTransfert"("produitId");

-- CreateIndex
CREATE INDEX "Fournisseur_companyId_idx" ON "Fournisseur"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Fournisseur_nom_companyId_key" ON "Fournisseur"("nom", "companyId");

-- CreateIndex
CREATE INDEX "CommandeFournisseur_companyId_idx" ON "CommandeFournisseur"("companyId");

-- CreateIndex
CREATE INDEX "CommandeFournisseur_fournisseurId_idx" ON "CommandeFournisseur"("fournisseurId");

-- CreateIndex
CREATE INDEX "CommandeFournisseur_statut_idx" ON "CommandeFournisseur"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "CommandeFournisseur_numero_companyId_key" ON "CommandeFournisseur"("numero", "companyId");

-- CreateIndex
CREATE INDEX "LigneCommandeFournisseur_commandeId_idx" ON "LigneCommandeFournisseur"("commandeId");

-- CreateIndex
CREATE INDEX "LigneCommandeFournisseur_produitId_idx" ON "LigneCommandeFournisseur"("produitId");

-- CreateIndex
CREATE INDEX "Inventaire_companyId_idx" ON "Inventaire"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventaire_numero_companyId_key" ON "Inventaire"("numero", "companyId");

-- CreateIndex
CREATE INDEX "LigneInventaire_inventaireId_idx" ON "LigneInventaire"("inventaireId");

-- CreateIndex
CREATE INDEX "LigneInventaire_produitId_idx" ON "LigneInventaire"("produitId");

-- CreateIndex
CREATE UNIQUE INDEX "LigneInventaire_inventaireId_produitId_key" ON "LigneInventaire"("inventaireId", "produitId");

-- CreateIndex
CREATE INDEX "CommandeClient_companyId_idx" ON "CommandeClient"("companyId");

-- CreateIndex
CREATE INDEX "CommandeClient_clientId_idx" ON "CommandeClient"("clientId");

-- CreateIndex
CREATE INDEX "CommandeClient_statut_idx" ON "CommandeClient"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "CommandeClient_numero_companyId_key" ON "CommandeClient"("numero", "companyId");

-- CreateIndex
CREATE INDEX "LigneCommandeClient_commandeId_idx" ON "LigneCommandeClient"("commandeId");

-- CreateIndex
CREATE INDEX "LigneCommandeClient_produitId_idx" ON "LigneCommandeClient"("produitId");

-- CreateIndex
CREATE UNIQUE INDEX "BonLivraison_commandeId_key" ON "BonLivraison"("commandeId");

-- CreateIndex
CREATE INDEX "BonLivraison_companyId_idx" ON "BonLivraison"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "BonLivraison_numero_companyId_key" ON "BonLivraison"("numero", "companyId");

-- CreateIndex
CREATE INDEX "LigneBonLivraison_bonLivraisonId_idx" ON "LigneBonLivraison"("bonLivraisonId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanComptableOHADA_numero_key" ON "PlanComptableOHADA"("numero");

-- CreateIndex
CREATE INDEX "PlanComptableOHADA_classe_idx" ON "PlanComptableOHADA"("classe");

-- CreateIndex
CREATE INDEX "PlanComptableOHADA_categorie_idx" ON "PlanComptableOHADA"("categorie");

-- CreateIndex
CREATE INDEX "ExerciceComptable_companyId_idx" ON "ExerciceComptable"("companyId");

-- CreateIndex
CREATE INDEX "ExerciceComptable_statut_idx" ON "ExerciceComptable"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciceComptable_companyId_annee_key" ON "ExerciceComptable"("companyId", "annee");

-- CreateIndex
CREATE INDEX "JournalComptable_companyId_idx" ON "JournalComptable"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalComptable_companyId_code_key" ON "JournalComptable"("companyId", "code");

-- CreateIndex
CREATE INDEX "EcritureComptable_journalId_idx" ON "EcritureComptable"("journalId");

-- CreateIndex
CREATE INDEX "EcritureComptable_exerciceId_idx" ON "EcritureComptable"("exerciceId");

-- CreateIndex
CREATE INDEX "EcritureComptable_compteNumero_idx" ON "EcritureComptable"("compteNumero");

-- CreateIndex
CREATE INDEX "EcritureComptable_dateEcriture_idx" ON "EcritureComptable"("dateEcriture");

-- CreateIndex
CREATE INDEX "EcritureComptable_companyId_idx" ON "EcritureComptable"("companyId");

-- CreateIndex
CREATE INDEX "SoldeCompte_companyId_idx" ON "SoldeCompte"("companyId");

-- CreateIndex
CREATE INDEX "SoldeCompte_exerciceId_idx" ON "SoldeCompte"("exerciceId");

-- CreateIndex
CREATE INDEX "SoldeCompte_compteNumero_idx" ON "SoldeCompte"("compteNumero");

-- CreateIndex
CREATE UNIQUE INDEX "SoldeCompte_companyId_exerciceId_compteNumero_periode_key" ON "SoldeCompte"("companyId", "exerciceId", "compteNumero", "periode");

-- CreateIndex
CREATE INDEX "LigneBilan_companyId_idx" ON "LigneBilan"("companyId");

-- CreateIndex
CREATE INDEX "LigneBilan_exerciceId_idx" ON "LigneBilan"("exerciceId");

-- CreateIndex
CREATE INDEX "LigneBilan_position_idx" ON "LigneBilan"("position");

-- CreateIndex
CREATE INDEX "LigneCompteResultat_companyId_idx" ON "LigneCompteResultat"("companyId");

-- CreateIndex
CREATE INDEX "LigneCompteResultat_exerciceId_idx" ON "LigneCompteResultat"("exerciceId");

-- CreateIndex
CREATE INDEX "LigneCompteResultat_type_idx" ON "LigneCompteResultat"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Devise_code_key" ON "Devise"("code");

-- CreateIndex
CREATE INDEX "Devise_code_idx" ON "Devise"("code");

-- CreateIndex
CREATE INDEX "TauxChange_deviseSourceId_idx" ON "TauxChange"("deviseSourceId");

-- CreateIndex
CREATE INDEX "TauxChange_deviseCibleId_idx" ON "TauxChange"("deviseCibleId");

-- CreateIndex
CREATE INDEX "TauxChange_dateEffet_idx" ON "TauxChange"("dateEffet");

-- CreateIndex
CREATE INDEX "ConversionDevise_companyId_idx" ON "ConversionDevise"("companyId");

-- CreateIndex
CREATE INDEX "ConversionDevise_dateConversion_idx" ON "ConversionDevise"("dateConversion");

-- CreateIndex
CREATE INDEX "Prospect_companyId_idx" ON "Prospect"("companyId");

-- CreateIndex
CREATE INDEX "Prospect_statut_idx" ON "Prospect"("statut");

-- CreateIndex
CREATE INDEX "Prospect_source_idx" ON "Prospect"("source");

-- CreateIndex
CREATE INDEX "Prospect_email_idx" ON "Prospect"("email");

-- CreateIndex
CREATE INDEX "Opportunite_companyId_idx" ON "Opportunite"("companyId");

-- CreateIndex
CREATE INDEX "Opportunite_prospectId_idx" ON "Opportunite"("prospectId");

-- CreateIndex
CREATE INDEX "Opportunite_etape_idx" ON "Opportunite"("etape");

-- CreateIndex
CREATE INDEX "Opportunite_statut_idx" ON "Opportunite"("statut");

-- CreateIndex
CREATE INDEX "ActiviteCRM_companyId_idx" ON "ActiviteCRM"("companyId");

-- CreateIndex
CREATE INDEX "ActiviteCRM_prospectId_idx" ON "ActiviteCRM"("prospectId");

-- CreateIndex
CREATE INDEX "ActiviteCRM_opportuniteId_idx" ON "ActiviteCRM"("opportuniteId");

-- CreateIndex
CREATE INDEX "ActiviteCRM_type_idx" ON "ActiviteCRM"("type");

-- CreateIndex
CREATE INDEX "ActiviteCRM_dateDebut_idx" ON "ActiviteCRM"("dateDebut");

-- CreateIndex
CREATE INDEX "PipelineVente_companyId_idx" ON "PipelineVente"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineVente_companyId_nom_key" ON "PipelineVente"("companyId", "nom");

-- CreateIndex
CREATE INDEX "EtapePipeline_pipelineId_idx" ON "EtapePipeline"("pipelineId");
