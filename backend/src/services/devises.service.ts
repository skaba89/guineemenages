// Service Multi-Devises pour GuinéaManager
// Gestion des taux de change et conversions

import prisma from '../utils/prisma';
import logger from '../utils/logger';

// Devises supportées pour l'Afrique de l'Ouest et internationales
const DEVISES_PAR_DEFAUT = [
  { code: 'GNF', nom: 'Franc guinéen', symbole: 'GNF', pays: 'Guinée' },
  { code: 'XOF', nom: 'Franc CFA (BCEAO)', symbole: 'FCFA', pays: 'UEMOA' },
  { code: 'XAF', nom: 'Franc CFA (BEAC)', symbole: 'FCFA', pays: 'CEMAC' },
  { code: 'EUR', nom: 'Euro', symbole: '€', pays: 'Europe' },
  { code: 'USD', nom: 'Dollar américain', symbole: '$', pays: 'États-Unis' },
  { code: 'GBP', nom: 'Livre sterling', symbole: '£', pays: 'Royaume-Uni' },
  { code: 'CNY', nom: 'Yuan chinois', symbole: '¥', pays: 'Chine' },
  { code: 'MAD', nom: 'Dirham marocain', symbole: 'MAD', pays: 'Maroc' },
  { code: 'DZD', nom: 'Dinar algérien', symbole: 'DZD', pays: 'Algérie' },
  { code: 'TND', nom: 'Dinar tunisien', symbole: 'TND', pays: 'Tunisie' },
  { code: 'NGN', nom: 'Naira nigérian', symbole: '₦', pays: 'Nigeria' },
  { code: 'GHS', nom: 'Cedi ghanéen', symbole: 'GH₵', pays: 'Ghana' },
  { code: 'SLL', nom: 'Leone sierra-léonais', symbole: 'Le', pays: 'Sierra Leone' },
  { code: 'LRD', nom: 'Dollar libérien', symbole: 'L$', pays: 'Liberia' },
  { code: 'SAR', nom: 'Riyal saoudien', symbole: '﷼', pays: 'Arabie Saoudite' },
];

export class DevisesService {
  /**
   * Initialiser les devises par défaut
   */
  static async initialiserDevises(): Promise<void> {
    try {
      const existing = await prisma.devise.count();
      if (existing > 0) {
        logger.info('Devises déjà initialisées');
        return;
      }

      await prisma.devise.createMany({
        data: DEVISES_PAR_DEFAUT.map(d => ({
          ...d,
          actif: true,
        })),
      });

      logger.info(`${DEVISES_PAR_DEFAUT.length} devises initialisées`);
    } catch (error) {
      logger.error('Erreur initialisation devises', error);
      throw error;
    }
  }

  /**
   * Lister toutes les devises
   */
  static async listerDevises(actifSeulement: boolean = true) {
    try {
      const devises = await prisma.devise.findMany({
        where: actifSeulement ? { actif: true } : undefined,
        orderBy: { code: 'asc' },
      });
      return devises;
    } catch (error) {
      logger.error('Erreur liste devises', error);
      throw error;
    }
  }

  /**
   * Obtenir une devise par code
   */
  static async obtenirDevise(code: string) {
    try {
      return await prisma.devise.findUnique({
        where: { code },
      });
    } catch (error) {
      logger.error('Erreur obtention devise', error);
      throw error;
    }
  }

  /**
   * Définir un taux de change
   */
  static async definirTaux(data: {
    deviseSource: string;
    deviseCible: string;
    taux: number;
    source?: string;
    dateEffet?: Date;
  }) {
    try {
      // Désactiver les anciens taux pour cette paire
      await prisma.tauxChange.updateMany({
        where: {
          deviseSourceId: data.deviseSource,
          deviseCibleId: data.deviseCible,
          actif: true,
        },
        data: { actif: false },
      });

      // Créer le nouveau taux
      const taux = await prisma.tauxChange.create({
        data: {
          deviseSourceId: data.deviseSource,
          deviseCibleId: data.deviseCible,
          taux: data.taux,
          dateEffet: data.dateEffet || new Date(),
          source: data.source || 'MANUEL',
          actif: true,
        },
      });

      // Créer aussi le taux inverse automatiquement
      await prisma.tauxChange.updateMany({
        where: {
          deviseSourceId: data.deviseCible,
          deviseCibleId: data.deviseSource,
          actif: true,
        },
        data: { actif: false },
      });

      await prisma.tauxChange.create({
        data: {
          deviseSourceId: data.deviseCible,
          deviseCibleId: data.deviseSource,
          taux: 1 / data.taux,
          dateEffet: data.dateEffet || new Date(),
          source: data.source || 'MANUEL',
          actif: true,
        },
      });

      logger.info(`Taux de change défini: 1 ${data.deviseSource} = ${data.taux} ${data.deviseCible}`);
      return taux;
    } catch (error) {
      logger.error('Erreur définition taux de change', error);
      throw error;
    }
  }

  /**
   * Obtenir le taux de change actuel
   */
  static async obtenirTaux(deviseSource: string, deviseCible: string, date?: Date) {
    try {
      // Si même devise, retourner 1
      if (deviseSource === deviseCible) {
        return { taux: 1, date: date || new Date() };
      }

      const taux = await prisma.tauxChange.findFirst({
        where: {
          deviseSourceId: deviseSource,
          deviseCibleId: deviseCible,
          actif: true,
          dateEffet: date ? { lte: date } : undefined,
        },
        orderBy: { dateEffet: 'desc' },
      });

      if (!taux) {
        throw new Error(`Aucun taux de change trouvé pour ${deviseSource}/${deviseCible}`);
      }

      return { taux: taux.taux, date: taux.dateEffet, source: taux.source };
    } catch (error) {
      logger.error('Erreur obtention taux de change', error);
      throw error;
    }
  }

  /**
   * Convertir un montant
   */
  static async convertir(
    montant: number,
    deviseSource: string,
    deviseCible: string,
    date?: Date
  ): Promise<{
    montantConverti: number;
    taux: number;
    dateConversion: Date;
  }> {
    try {
      // Si même devise, pas de conversion
      if (deviseSource === deviseCible) {
        return {
          montantConverti: montant,
          taux: 1,
          dateConversion: date || new Date(),
        };
      }

      const { taux } = await this.obtenirTaux(deviseSource, deviseCible, date);
      const montantConverti = Math.round(montant * taux * 100) / 100;

      return {
        montantConverti,
        taux,
        dateConversion: date || new Date(),
      };
    } catch (error) {
      logger.error('Erreur conversion', error);
      throw error;
    }
  }

  /**
   * Enregistrer une conversion pour une société
   */
  static async enregistrerConversion(companyId: string, data: {
    montant: number;
    deviseSource: string;
    deviseCible: string;
    reference?: string;
    referenceId?: string;
  }) {
    try {
      const { montantConverti, taux, dateConversion } = await this.convertir(
        data.montant,
        data.deviseSource,
        data.deviseCible
      );

      const conversion = await prisma.conversionDevise.create({
        data: {
          companyId,
          montant: data.montant,
          deviseSource: data.deviseSource,
          deviseCible: data.deviseCible,
          tauxApplique: taux,
          montantConverti,
          dateConversion,
          reference: data.reference,
          referenceId: data.referenceId,
        },
      });

      logger.info(`Conversion enregistrée: ${data.montant} ${data.deviseSource} = ${montantConverti} ${data.deviseCible}`);
      return conversion;
    } catch (error) {
      logger.error('Erreur enregistrement conversion', error);
      throw error;
    }
  }

  /**
   * Obtenir l'historique des taux pour une paire de devises
   */
  static async historiqueTaux(
    deviseSource: string,
    deviseCible: string,
    dateDebut?: Date,
    dateFin?: Date
  ) {
    try {
      const where: any = {
        deviseSourceId: deviseSource,
        deviseCibleId: deviseCible,
      };

      if (dateDebut || dateFin) {
        where.dateEffet = {};
        if (dateDebut) where.dateEffet.gte = dateDebut;
        if (dateFin) where.dateEffet.lte = dateFin;
      }

      const taux = await prisma.tauxChange.findMany({
        where,
        orderBy: { dateEffet: 'desc' },
        take: 100,
      });

      return taux;
    } catch (error) {
      logger.error('Erreur historique taux', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les taux actuels
   */
  static async tousLesTauxActuels(deviseBase: string = 'EUR') {
    try {
      const devises = await prisma.devise.findMany({
        where: { actif: true },
        select: { code: true, nom: true, symbole: true },
      });

      const taux = [];
      for (const devise of devises) {
        if (devise.code === deviseBase) {
          taux.push({
            ...devise,
            taux: 1,
          });
          continue;
        }

        try {
          const { taux: t } = await this.obtenirTaux(deviseBase, devise.code);
          taux.push({
            ...devise,
            taux: t,
          });
        } catch {
          taux.push({
            ...devise,
            taux: null,
          });
        }
      }

      return {
        deviseBase,
        dateMaj: new Date(),
        taux,
      };
    } catch (error) {
      logger.error('Erreur obtention tous les taux', error);
      throw error;
    }
  }

  /**
   * Calculer le taux croisé (via une devise pivot)
   */
  static async tauxCroise(
    deviseSource: string,
    deviseCible: string,
    devisePivot: string = 'EUR'
  ) {
    try {
      // Si même devise
      if (deviseSource === deviseCible) {
        return { taux: 1, methode: 'DIRECT' };
      }

      // Essayer d'abord le taux direct
      try {
        const { taux } = await this.obtenirTaux(deviseSource, deviseCible);
        return { taux, methode: 'DIRECT' };
      } catch {
        // Continuer avec le taux croisé
      }

      // Calculer via le pivot
      const tauxSourceToPivot = await this.obtenirTaux(deviseSource, devisePivot);
      const tauxPivotToCible = await this.obtenirTaux(devisePivot, deviseCible);

      const tauxCroise = tauxSourceToPivot.taux * tauxPivotToCible.taux;

      return {
        taux: tauxCroise,
        methode: 'CROISE',
        via: devisePivot,
      };
    } catch (error) {
      logger.error('Erreur calcul taux croisé', error);
      throw error;
    }
  }

  /**
   * Formater un montant avec la devise
   */
  static formaterMontant(montant: number, codeDevise: string): string {
    const formatters: Record<string, (m: number) => string> = {
      'GNF': (m) => `${m.toLocaleString('fr-GN')} GNF`,
      'XOF': (m) => `${m.toLocaleString('fr-SN')} FCFA`,
      'XAF': (m) => `${m.toLocaleString('fr-CM')} FCFA`,
      'EUR': (m) => `${m.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      'USD': (m) => `$${m.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      'GBP': (m) => `£${m.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
    };

    const formatter = formatters[codeDevise];
    if (formatter) {
      return formatter(montant);
    }

    return `${montant.toLocaleString()} ${codeDevise}`;
  }

  /**
   * Mettre à jour les taux depuis une API externe (simulation)
   * En production, connecter à une vraie API comme exchangerate-api ou fixer
   */
  static async mettreAJourTauxDepuisAPI(): Promise<void> {
    try {
      // Taux de référence simulés (en production, utiliser une vraie API)
      const tauxReferemce = [
        { source: 'EUR', cible: 'GNF', taux: 11500 },
        { source: 'EUR', cible: 'XOF', taux: 655.957 },
        { source: 'EUR', cible: 'XAF', taux: 655.957 },
        { source: 'EUR', cible: 'USD', taux: 1.08 },
        { source: 'EUR', cible: 'GBP', taux: 0.86 },
        { source: 'EUR', cible: 'CNY', taux: 7.82 },
        { source: 'EUR', cible: 'NGN', taux: 1650 },
        { source: 'EUR', cible: 'GHS', taux: 16.5 },
        { source: 'EUR', cible: 'SLL', taux: 24500 },
        { source: 'EUR', cible: 'LRD', taux: 200 },
        { source: 'USD', cible: 'GNF', taux: 10650 },
        { source: 'USD', cible: 'XOF', taux: 607 },
        { source: 'USD', cible: 'XAF', taux: 607 },
        { source: 'USD', cible: 'GBP', taux: 0.80 },
        { source: 'USD', cible: 'NGN', taux: 1530 },
        { source: 'USD', cible: 'GHS', taux: 15.3 },
      ];

      for (const t of tauxReferemce) {
        await this.definirTaux({
          deviseSource: t.source,
          deviseCible: t.cible,
          taux: t.taux,
          source: 'API',
        });
      }

      logger.info('Taux de change mis à jour depuis API');
    } catch (error) {
      logger.error('Erreur mise à jour taux depuis API', error);
      throw error;
    }
  }

  /**
   * Obtenir les devises préférées pour un pays
   */
  static getDevisesPourPays(codePays: string): string[] {
    const devisesParPays: Record<string, string[]> = {
      'GN': ['GNF', 'EUR', 'USD', 'XOF'],
      'SN': ['XOF', 'EUR', 'USD'],
      'ML': ['XOF', 'EUR', 'USD'],
      'CI': ['XOF', 'EUR', 'USD'],
      'BF': ['XOF', 'EUR', 'USD'],
      'BJ': ['XOF', 'EUR', 'USD'],
      'NE': ['XOF', 'EUR', 'USD'],
      'TG': ['XOF', 'EUR', 'USD'],
      'CM': ['XAF', 'EUR', 'USD'],
      'GA': ['XAF', 'EUR', 'USD'],
      'CG': ['XAF', 'EUR', 'USD'],
      'NG': ['NGN', 'USD', 'EUR'],
      'GH': ['GHS', 'USD', 'EUR'],
    };

    return devisesParPays[codePays] || ['USD', 'EUR'];
  }
}

export default DevisesService;
