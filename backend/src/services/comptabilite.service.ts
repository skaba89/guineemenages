// Service de Comptabilité OHADA pour GuinéaManager
// Implémente le plan comptable Syscohada révisé

import prisma from '../utils/prisma';
import logger from '../utils/logger';

// Plan comptable OHADA simplifié (classes principales)
const PLAN_COMPTABLE_OHADA = [
  // Classe 1 - Capitaux
  { numero: '101', intitule: 'Capital social', classe: 1, categorie: 'PASSIF' },
  { numero: '106', intitule: 'Réserves', classe: 1, categorie: 'PASSIF' },
  { numero: '12', intitule: 'Résultat de l\'exercice', classe: 1, categorie: 'PASSIF' },
  { numero: '16', intitule: 'Emprunts et dettes assimilées', classe: 1, categorie: 'PASSIF' },
  
  // Classe 2 - Immobilisations
  { numero: '21', intitule: 'Immobilisations incorporelles', classe: 2, categorie: 'ACTIF' },
  { numero: '22', intitule: 'Terrains', classe: 2, categorie: 'ACTIF' },
  { numero: '23', intitule: 'Bâtiments et constructions', classe: 2, categorie: 'ACTIF' },
  { numero: '24', intitule: 'Matériel et outillage', classe: 2, categorie: 'ACTIF' },
  { numero: '25', intitule: 'Matériel de transport', classe: 2, categorie: 'ACTIF' },
  { numero: '28', intitule: 'Amortissements', classe: 2, categorie: 'ACTIF' },
  
  // Classe 3 - Stocks
  { numero: '31', intitule: 'Marchandises', classe: 3, categorie: 'ACTIF' },
  { numero: '32', intitule: 'Matières premières', classe: 3, categorie: 'ACTIF' },
  { numero: '35', intitule: 'Produits finis', classe: 3, categorie: 'ACTIF' },
  { numero: '39', intitule: 'Provisions pour dépréciation des stocks', classe: 3, categorie: 'ACTIF' },
  
  // Classe 4 - Tiers
  { numero: '401', intitule: 'Fournisseurs', classe: 4, categorie: 'PASSIF' },
  { numero: '411', intitule: 'Clients', classe: 4, categorie: 'ACTIF' },
  { numero: '421', intitule: 'Personnel - Salaires à payer', classe: 4, categorie: 'PASSIF' },
  { numero: '431', intitule: 'Organismes sociaux', classe: 4, categorie: 'PASSIF' },
  { numero: '44', intitule: 'État et collectivités publiques', classe: 4, categorie: 'PASSIF' },
  { numero: '47', intitule: 'Comptes d\'attente', classe: 4, categorie: 'ACTIF' },
  
  // Classe 5 - Trésorerie
  { numero: '521', intitule: 'Banques', classe: 5, categorie: 'ACTIF' },
  { numero: '571', intitule: 'Caisse', classe: 5, categorie: 'ACTIF' },
  { numero: '581', intitule: 'Virements internes', classe: 5, categorie: 'ACTIF' },
  
  // Classe 6 - Charges
  { numero: '60', intitule: 'Achats et variations de stocks', classe: 6, categorie: 'CHARGE' },
  { numero: '61', intitule: 'Services extérieurs', classe: 6, categorie: 'CHARGE' },
  { numero: '62', intitule: 'Autres services extérieurs', classe: 6, categorie: 'CHARGE' },
  { numero: '63', intitule: 'Charges de personnel', classe: 6, categorie: 'CHARGE' },
  { numero: '64', intitule: 'Impôts et taxes', classe: 6, categorie: 'CHARGE' },
  { numero: '65', intitule: 'Autres charges', classe: 6, categorie: 'CHARGE' },
  { numero: '66', intitule: 'Charges financières', classe: 6, categorie: 'CHARGE' },
  { numero: '68', intitule: 'Dotations aux amortissements', classe: 6, categorie: 'CHARGE' },
  
  // Classe 7 - Produits
  { numero: '70', intitule: 'Ventes de marchandises', classe: 7, categorie: 'PRODUIT' },
  { numero: '71', intitule: 'Ventes de produits fabriqués', classe: 7, categorie: 'PRODUIT' },
  { numero: '72', intitule: 'Production stockée', classe: 7, categorie: 'PRODUIT' },
  { numero: '74', intitule: 'Subventions d\'exploitation', classe: 7, categorie: 'PRODUIT' },
  { numero: '75', intitule: 'Autres produits', classe: 7, categorie: 'PRODUIT' },
  { numero: '76', intitule: 'Produits financiers', classe: 7, categorie: 'PRODUIT' },
  { numero: '77', intitule: 'Produits exceptionnels', classe: 7, categorie: 'PRODUIT' },
  
  // Classe 8 - Résultats
  { numero: '81', intitule: 'Valeurs comptables des cessions', classe: 8, categorie: 'CHARGE' },
  { numero: '82', intitule: 'Produits des cessions', classe: 8, categorie: 'PRODUIT' },
];

// Types de journaux
const TYPES_JOURNAUX = [
  { code: 'VT', nom: 'Journal des Ventes', type: 'VENTES' },
  { code: 'AC', nom: 'Journal des Achats', type: 'ACHATS' },
  { code: 'BQ', nom: 'Journal de Banque', type: 'BANQUE' },
  { code: 'CA', nom: 'Journal de Caisse', type: 'CAISSE' },
  { code: 'OD', nom: 'Journal des Opérations Diverses', type: 'OD' },
  { code: 'GL', nom: 'Journal Général', type: 'GENERAL' },
];

export class ComptabiliteService {
  /**
   * Initialiser le plan comptable OHADA pour une nouvelle société
   */
  static async initialiserPlanComptable(): Promise<void> {
    try {
      const existing = await prisma.planComptableOHADA.count();
      if (existing > 0) {
        logger.info('Plan comptable OHADA déjà initialisé');
        return;
      }

      await prisma.planComptableOHADA.createMany({
        data: PLAN_COMPTABLE_OHADA.map(compte => ({
          ...compte,
          type: 'COMPTE',
          actif: true,
        })),
      });

      logger.info(`Plan comptable OHADA initialisé avec ${PLAN_COMPTABLE_OHADA.length} comptes`);
    } catch (error) {
      logger.error('Erreur initialisation plan comptable OHADA', error);
      throw error;
    }
  }

  /**
   * Créer un exercice comptable pour une société
   */
  static async creerExercice(
    companyId: string,
    annee: number,
    dateDebut: Date,
    dateFin: Date
  ) {
    try {
      // Vérifier si un exercice existe déjà pour cette année
      const existing = await prisma.exerciceComptable.findUnique({
        where: { companyId_annee: { companyId, annee } },
      });

      if (existing) {
        throw new Error(`Un exercice comptable existe déjà pour l'année ${annee}`);
      }

      const exercice = await prisma.exerciceComptable.create({
        data: {
          companyId,
          annee,
          dateDebut,
          dateFin,
          statut: 'OUVERT',
        },
      });

      // Créer les journaux par défaut
      await this.creerJournauxParDefaut(companyId, exercice.id);

      logger.info(`Exercice comptable ${annee} créé pour la société ${companyId}`);
      return exercice;
    } catch (error) {
      logger.error('Erreur création exercice comptable', error);
      throw error;
    }
  }

  /**
   * Créer les journaux par défaut pour un exercice
   */
  static async creerJournauxParDefaut(companyId: string, exerciceId: string) {
    try {
      const journaux = await prisma.journalComptable.createMany({
        data: TYPES_JOURNAUX.map(j => ({
          companyId,
          code: j.code,
          nom: j.nom,
          type: j.type,
          actif: true,
        })),
      });

      return journaux;
    } catch (error) {
      logger.error('Erreur création journaux par défaut', error);
      throw error;
    }
  }

  /**
   * Enregistrer une écriture comptable
   */
  static async enregistrerEcriture(data: {
    companyId: string;
    journalCode: string;
    exerciceId: string;
    dateEcriture: Date;
    lignes: Array<{
      compteNumero: string;
      libelle: string;
      debit: number;
      credit: number;
      tiersType?: string;
      tiersId?: string;
      tiersNom?: string;
    }>;
    reference?: string;
    sourceType?: string;
    sourceId?: string;
  }) {
    try {
      // Vérifier l'équilibre de l'écriture
      const totalDebit = data.lignes.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = data.lignes.reduce((sum, l) => sum + l.credit, 0);

      if (totalDebit !== totalCredit) {
        throw new Error(`Écriture non équilibrée: Débit=${totalDebit}, Crédit=${totalCredit}`);
      }

      // Récupérer le journal
      const journal = await prisma.journalComptable.findFirst({
        where: { companyId: data.companyId, code: data.journalCode },
      });

      if (!journal) {
        throw new Error(`Journal ${data.journalCode} non trouvé`);
      }

      // Générer le numéro de pièce
      const dernierNumero = await prisma.ecritureComptable.count({
        where: { journalId: journal.id },
      });
      const numeroPiece = `${data.journalCode}-${(dernierNumero + 1).toString().padStart(6, '0')}`;

      // Créer les écritures
      const ecritures = await prisma.$transaction(
        data.lignes.map(ligne =>
          prisma.ecritureComptable.create({
            data: {
              journalId: journal.id,
              exerciceId: data.exerciceId,
              numeroPiece,
              dateEcriture: data.dateEcriture,
              compteNumero: ligne.compteNumero,
              compteIntitule: this.getIntituleCompte(ligne.compteNumero),
              libelle: ligne.libelle,
              reference: data.reference,
              debit: ligne.debit,
              credit: ligne.credit,
              solde: ligne.debit - ligne.credit,
              tiersType: ligne.tiersType,
              tiersId: ligne.tiersId,
              tiersNom: ligne.tiersNom,
              sourceType: data.sourceType,
              sourceId: data.sourceId,
              companyId: data.companyId,
            },
          })
        )
      );

      logger.info(`Écriture ${numeroPiece} enregistrée avec ${ecritures.length} lignes`);
      return ecritures;
    } catch (error) {
      logger.error('Erreur enregistrement écriture comptable', error);
      throw error;
    }
  }

  /**
   * Obtenir l'intitulé d'un compte OHADA
   */
  static getIntituleCompte(numero: string): string {
    const compte = PLAN_COMPTABLE_OHADA.find(c => 
      numero.startsWith(c.numero) || c.numero === numero
    );
    return compte?.intitule || 'Compte inconnu';
  }

  /**
   * Enregistrer automatiquement une facture de vente
   */
  static async enregistrerFactureVente(
    companyId: string,
    facture: {
      id: string;
      numero: string;
      clientId: string;
      clientNom: string;
      montantHT: number;
      montantTVA: number;
      montantTTC: number;
    }
  ) {
    try {
      // Récupérer l'exercice en cours
      const exercice = await prisma.exerciceComptable.findFirst({
        where: { companyId, statut: 'OUVERT' },
        orderBy: { annee: 'desc' },
      });

      if (!exercice) {
        throw new Error('Aucun exercice comptable ouvert');
      }

      const lignes = [
        // Débit: Clients (411)
        {
          compteNumero: '411',
          libelle: `Facture ${facture.numero} - ${facture.clientNom}`,
          debit: facture.montantTTC,
          credit: 0,
          tiersType: 'CLIENT',
          tiersId: facture.clientId,
          tiersNom: facture.clientNom,
        },
        // Crédit: Ventes (70)
        {
          compteNumero: '70',
          libelle: `Vente facture ${facture.numero}`,
          debit: 0,
          credit: facture.montantHT,
        },
        // Crédit: TVA collectée (4427 - État, TVA collectée)
        ...(facture.montantTVA > 0 ? [{
          compteNumero: '44',
          libelle: `TVA collectée - Facture ${facture.numero}`,
          debit: 0,
          credit: facture.montantTVA,
        }] : []),
      ];

      return await this.enregistrerEcriture({
        companyId,
        journalCode: 'VT',
        exerciceId: exercice.id,
        dateEcriture: new Date(),
        lignes,
        reference: facture.numero,
        sourceType: 'FACTURE',
        sourceId: facture.id,
      });
    } catch (error) {
      logger.error('Erreur enregistrement facture vente', error);
      throw error;
    }
  }

  /**
   * Enregistrer un paiement
   */
  static async enregistrerPaiement(
    companyId: string,
    paiement: {
      id: string;
      factureId: string;
      factureNumero: string;
      clientId: string;
      clientNom: string;
      montant: number;
      mode: string;
    }
  ) {
    try {
      const exercice = await prisma.exerciceComptable.findFirst({
        where: { companyId, statut: 'OUVERT' },
        orderBy: { annee: 'desc' },
      });

      if (!exercice) {
        throw new Error('Aucun exercice comptable ouvert');
      }

      // Déterminer le compte de trésorerie selon le mode
      const compteTresorerie = this.getCompteTresorerie(paiement.mode);
      const journalCode = this.getJournalCode(paiement.mode);

      const lignes = [
        // Débit: Trésorerie
        {
          compteNumero: compteTresorerie,
          libelle: `Paiement facture ${paiement.factureNumero} - ${paiement.clientNom}`,
          debit: paiement.montant,
          credit: 0,
        },
        // Crédit: Clients
        {
          compteNumero: '411',
          libelle: `Encaissement facture ${paiement.factureNumero}`,
          debit: 0,
          credit: paiement.montant,
          tiersType: 'CLIENT',
          tiersId: paiement.clientId,
          tiersNom: paiement.clientNom,
        },
      ];

      return await this.enregistrerEcriture({
        companyId,
        journalCode,
        exerciceId: exercice.id,
        dateEcriture: new Date(),
        lignes,
        reference: paiement.factureNumero,
        sourceType: 'PAIEMENT',
        sourceId: paiement.id,
      });
    } catch (error) {
      logger.error('Erreur enregistrement paiement', error);
      throw error;
    }
  }

  /**
   * Obtenir le compte de trésorerie selon le mode de paiement
   */
  static getCompteTresorerie(mode: string): string {
    switch (mode) {
      case 'VIREMENT':
      case 'CARTE':
        return '521'; // Banques
      case 'ORANGE_MONEY':
      case 'MTN_MONEY':
        return '521'; // Mobile Money -> Banque
      case 'ESPECES':
        return '571'; // Caisse
      default:
        return '521';
    }
  }

  /**
   * Obtenir le code journal selon le mode de paiement
   */
  static getJournalCode(mode: string): string {
    switch (mode) {
      case 'ESPECES':
        return 'CA'; // Caisse
      default:
        return 'BQ'; // Banque
    }
  }

  /**
   * Générer le grand livre
   */
  static async getGrandLivre(
    companyId: string,
    exerciceId: string,
    compteDebut?: string,
    compteFin?: string,
    dateDebut?: Date,
    dateFin?: Date
  ) {
    try {
      const where: any = { companyId, exerciceId };

      if (compteDebut || compteFin) {
        where.compteNumero = {};
        if (compteDebut) where.compteNumero.gte = compteDebut;
        if (compteFin) where.compteNumero.lte = compteFin;
      }

      if (dateDebut || dateFin) {
        where.dateEcriture = {};
        if (dateDebut) where.dateEcriture.gte = dateDebut;
        if (dateFin) where.dateEcriture.lte = dateFin;
      }

      const ecritures = await prisma.ecritureComptable.findMany({
        where,
        orderBy: [{ compteNumero: 'asc' }, { dateEcriture: 'asc' }],
      });

      // Grouper par compte
      const grandLivre: Record<string, any> = {};
      for (const e of ecritures) {
        if (!grandLivre[e.compteNumero]) {
          grandLivre[e.compteNumero] = {
            compteNumero: e.compteNumero,
            compteIntitule: e.compteIntitule,
            totalDebit: 0,
            totalCredit: 0,
            solde: 0,
            lignes: [],
          };
        }
        grandLivre[e.compteNumero].totalDebit += e.debit;
        grandLivre[e.compteNumero].totalCredit += e.credit;
        grandLivre[e.compteNumero].solde += e.debit - e.credit;
        grandLivre[e.compteNumero].lignes.push(e);
      }

      return Object.values(grandLivre);
    } catch (error) {
      logger.error('Erreur génération grand livre', error);
      throw error;
    }
  }

  /**
   * Générer la balance
   */
  static async getBalance(companyId: string, exerciceId: string, periode?: string) {
    try {
      const where: any = { companyId, exerciceId, valide: true };
      
      if (periode) {
        const [annee, mois] = periode.split('-').map(Number);
        const dateDebut = new Date(annee, mois - 1, 1);
        const dateFin = new Date(annee, mois, 0);
        where.dateEcriture = { gte: dateDebut, lte: dateFin };
      }

      const ecritures = await prisma.ecritureComptable.findMany({ where });

      // Grouper par compte
      const balance: Record<string, any> = {};
      for (const e of ecritures) {
        if (!balance[e.compteNumero]) {
          balance[e.compteNumero] = {
            compteNumero: e.compteNumero,
            compteIntitule: e.compteIntitule,
            debit: 0,
            credit: 0,
            soldeDebiteur: 0,
            soldeCrediteur: 0,
          };
        }
        balance[e.compteNumero].debit += e.debit;
        balance[e.compteNumero].credit += e.credit;
      }

      // Calculer les soldes
      for (const compte of Object.values(balance) as any[]) {
        const solde = compte.debit - compte.credit;
        if (solde > 0) {
          compte.soldeDebiteur = solde;
        } else {
          compte.soldeCrediteur = Math.abs(solde);
        }
      }

      return Object.values(balance);
    } catch (error) {
      logger.error('Erreur génération balance', error);
      throw error;
    }
  }

  /**
   * Générer le bilan
   */
  static async genererBilan(companyId: string, exerciceId: string) {
    try {
      const balance = await this.getBalance(companyId, exerciceId);

      const bilan = {
        actif: {
          immobilisations: { intitule: 'Immobilisations', montant: 0 },
          stocks: { intitule: 'Stocks', montant: 0 },
          creances: { intitule: 'Créances clients', montant: 0 },
          tresorerie: { intitule: 'Trésorerie', montant: 0 },
          totalActif: 0,
        },
        passif: {
          capitaux: { intitule: 'Capitaux propres', montant: 0 },
          dettes: { intitule: 'Dettes', montant: 0 },
          totalPassif: 0,
        },
      };

      for (const compte of balance) {
        const numero = compte.compteNumero;
        const solde = compte.soldeDebiteur || compte.soldeCrediteur;

        // Actif (classes 2, 3, 4 débiteurs, 5)
        if (numero.startsWith('2')) {
          bilan.actif.immobilisations.montant += solde;
        } else if (numero.startsWith('3')) {
          bilan.actif.stocks.montant += solde;
        } else if (numero.startsWith('4') && compte.soldeDebiteur > 0) {
          bilan.actif.creances.montant += solde;
        } else if (numero.startsWith('5')) {
          bilan.actif.tresorerie.montant += solde;
        }

        // Passif (classes 1, 4 créditeurs)
        if (numero.startsWith('1')) {
          bilan.passif.capitaux.montant += solde;
        } else if ((numero.startsWith('4') && compte.soldeCrediteur > 0) || numero.startsWith('16')) {
          bilan.passif.dettes.montant += solde;
        }
      }

      bilan.actif.totalActif = 
        bilan.actif.immobilisations.montant +
        bilan.actif.stocks.montant +
        bilan.actif.creances.montant +
        bilan.actif.tresorerie.montant;

      bilan.passif.totalPassif = 
        bilan.passif.capitaux.montant +
        bilan.passif.dettes.montant;

      return bilan;
    } catch (error) {
      logger.error('Erreur génération bilan', error);
      throw error;
    }
  }

  /**
   * Générer le compte de résultat
   */
  static async genererCompteResultat(companyId: string, exerciceId: string) {
    try {
      const balance = await this.getBalance(companyId, exerciceId);

      const compteResultat = {
        charges: {
          achats: { intitule: 'Achats consommés', montant: 0 },
          services: { intitule: 'Services externes', montant: 0 },
          personnel: { intitule: 'Charges de personnel', montant: 0 },
          amortissements: { intitule: 'Dotations aux amortissements', montant: 0 },
          financier: { intitule: 'Charges financières', montant: 0 },
          autres: { intitule: 'Autres charges', montant: 0 },
          totalCharges: 0,
        },
        produits: {
          ventes: { intitule: 'Chiffre d\'affaires', montant: 0 },
          production: { intitule: 'Production stockée', montant: 0 },
          financier: { intitule: 'Produits financiers', montant: 0 },
          autres: { intitule: 'Autres produits', montant: 0 },
          totalProduits: 0,
        },
        resultatNet: 0,
      };

      for (const compte of balance) {
        const numero = compte.compteNumero;
        const solde = compte.soldeDebiteur || compte.soldeCrediteur;

        // Charges (classe 6)
        if (numero.startsWith('60')) {
          compteResultat.charges.achats.montant += solde;
        } else if (numero.startsWith('61') || numero.startsWith('62')) {
          compteResultat.charges.services.montant += solde;
        } else if (numero.startsWith('63')) {
          compteResultat.charges.personnel.montant += solde;
        } else if (numero.startsWith('68')) {
          compteResultat.charges.amortissements.montant += solde;
        } else if (numero.startsWith('66')) {
          compteResultat.charges.financier.montant += solde;
        } else if (numero.startsWith('6')) {
          compteResultat.charges.autres.montant += solde;
        }

        // Produits (classe 7)
        if (numero.startsWith('70') || numero.startsWith('71')) {
          compteResultat.produits.ventes.montant += solde;
        } else if (numero.startsWith('72')) {
          compteResultat.produits.production.montant += solde;
        } else if (numero.startsWith('76')) {
          compteResultat.produits.financier.montant += solde;
        } else if (numero.startsWith('7')) {
          compteResultat.produits.autres.montant += solde;
        }
      }

      compteResultat.charges.totalCharges = 
        compteResultat.charges.achats.montant +
        compteResultat.charges.services.montant +
        compteResultat.charges.personnel.montant +
        compteResultat.charges.amortissements.montant +
        compteResultat.charges.financier.montant +
        compteResultat.charges.autres.montant;

      compteResultat.produits.totalProduits = 
        compteResultat.produits.ventes.montant +
        compteResultat.produits.production.montant +
        compteResultat.produits.financier.montant +
        compteResultat.produits.autres.montant;

      compteResultat.resultatNet = 
        compteResultat.produits.totalProduits - compteResultat.charges.totalCharges;

      return compteResultat;
    } catch (error) {
      logger.error('Erreur génération compte de résultat', error);
      throw error;
    }
  }

  /**
   * Clôturer un exercice
   */
  static async cloturerExercice(companyId: string, exerciceId: string, userId: string) {
    try {
      const exercice = await prisma.exerciceComptable.findFirst({
        where: { id: exerciceId, companyId },
      });

      if (!exercice) {
        throw new Error('Exercice non trouvé');
      }

      if (exercice.statut !== 'OUVERT') {
        throw new Error('L\'exercice n\'est pas ouvert');
      }

      // Générer le résultat net
      const compteResultat = await this.genererCompteResultat(companyId, exerciceId);

      // Mettre à jour l'exercice
      await prisma.exerciceComptable.update({
        where: { id: exerciceId },
        data: {
          statut: 'CLOTURE',
          dateCloture: new Date(),
          cluturePar: userId,
          resultatNet: compteResultat.resultatNet,
        },
      });

      // Créer l'exercice suivant
      const anneeSuivante = exercice.annee + 1;
      const dateDebut = new Date(anneeSuivante, 0, 1);
      const dateFin = new Date(anneeSuivante, 11, 31);

      await this.creerExercice(companyId, anneeSuivante, dateDebut, dateFin);

      logger.info(`Exercice ${exercice.annee} clôturé, résultat: ${compteResultat.resultatNet}`);
      return { message: 'Exercice clôturé avec succès', resultatNet: compteResultat.resultatNet };
    } catch (error) {
      logger.error('Erreur clôture exercice', error);
      throw error;
    }
  }
}

export default ComptabiliteService;
