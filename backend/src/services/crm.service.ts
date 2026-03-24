// Service CRM pour GuinéaManager
// Gestion des prospects, opportunités et activités

import prisma from '../utils/prisma';
import logger from '../utils/logger';

export class CRMService {
  // ==================== PROSPECTS ====================

  /**
   * Créer un nouveau prospect
   */
  static async creerProspect(companyId: string, data: {
    nom: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    entreprise?: string;
    poste?: string;
    adresse?: string;
    ville?: string;
    pays?: string;
    source?: string;
    budget?: number;
    notes?: string;
    tags?: string[];
    assigneA?: string;
  }) {
    try {
      const prospect = await prisma.prospect.create({
        data: {
          companyId,
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone,
          entreprise: data.entreprise,
          poste: data.poste,
          adresse: data.adresse,
          ville: data.ville,
          pays: data.pays || 'Guinée',
          source: data.source,
          statut: 'NOUVEAU',
          score: 0,
          budget: data.budget,
          notes: data.notes,
          tags: data.tags ? JSON.stringify(data.tags) : null,
          assigneA: data.assigneA,
          dateContact: new Date(),
        },
      });

      // Créer une activité de création
      await this.creerActivite(companyId, {
        prospectId: prospect.id,
        type: 'NOTE',
        titre: `Prospect créé - ${data.nom}`,
        description: `Source: ${data.source || 'Non spécifiée'}`,
        dateDebut: new Date(),
        statut: 'TERMINE',
      });

      logger.info(`Prospect créé: ${prospect.id}`);
      return prospect;
    } catch (error) {
      logger.error('Erreur création prospect', error);
      throw error;
    }
  }

  /**
   * Lister les prospects avec filtres
   */
  static async listerProspects(
    companyId: string,
    filters?: {
      statut?: string;
      source?: string;
      assigneA?: string;
      recherche?: string;
    },
    pagination?: { page: number; limit: number }
  ) {
    try {
      const where: any = { companyId };

      if (filters?.statut) where.statut = filters.statut;
      if (filters?.source) where.source = filters.source;
      if (filters?.assigneA) where.assigneA = filters.assigneA;
      if (filters?.recherche) {
        where.OR = [
          { nom: { contains: filters.recherche } },
          { email: { contains: filters.recherche } },
          { telephone: { contains: filters.recherche } },
          { entreprise: { contains: filters.recherche } },
        ];
      }

      const total = await prisma.prospect.count({ where });
      const prospects = await prisma.prospect.findMany({
        where,
        include: {
          opportunites: { take: 5, orderBy: { createdAt: 'desc' } },
          _count: { select: { opportunites: true, activites: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
      });

      return {
        data: prospects,
        total,
        page: pagination?.page || 1,
        limit: pagination?.limit || total,
      };
    } catch (error) {
      logger.error('Erreur liste prospects', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'un prospect
   */
  static async mettreAJourStatutProspect(
    prospectId: string,
    companyId: string,
    nouveauStatut: string,
    notes?: string
  ) {
    try {
      const updateData: any = { statut: nouveauStatut };

      switch (nouveauStatut) {
        case 'CONTACTE':
          updateData.dateContact = new Date();
          break;
        case 'QUALIFIE':
          updateData.dateQualif = new Date();
          break;
        case 'GAGNE':
          // Sera converti en client
          break;
      }

      const prospect = await prisma.prospect.update({
        where: { id: prospectId, companyId },
        data: updateData,
      });

      // Créer une activité
      await this.creerActivite(companyId, {
        prospectId,
        type: 'NOTE',
        titre: `Statut changé: ${nouveauStatut}`,
        description: notes,
        dateDebut: new Date(),
        statut: 'TERMINE',
      });

      logger.info(`Statut prospect ${prospectId} mis à jour: ${nouveauStatut}`);
      return prospect;
    } catch (error) {
      logger.error('Erreur mise à jour statut prospect', error);
      throw error;
    }
  }

  /**
   * Calculer le score d'un prospect
   */
  static async calculerScoreProspect(prospectId: string, companyId: string) {
    try {
      const prospect = await prisma.prospect.findFirst({
        where: { id: prospectId, companyId },
        include: {
          opportunites: true,
          activites: true,
        },
      });

      if (!prospect) throw new Error('Prospect non trouvé');

      let score = 0;

      // Points pour les informations complètes
      if (prospect.email) score += 10;
      if (prospect.telephone) score += 10;
      if (prospect.entreprise) score += 15;
      if (prospect.poste) score += 5;
      if (prospect.budget && prospect.budget > 0) score += 20;

      // Points pour les activités
      score += Math.min(prospect.activites.length * 5, 20);

      // Points pour les opportunités
      const opportunesActives = prospect.opportunites.filter(
        o => o.statut === 'EN_COURS'
      );
      score += opportunesActives.length * 10;

      // Plafonner à 100
      score = Math.min(score, 100);

      await prisma.prospect.update({
        where: { id: prospectId },
        data: { score },
      });

      return score;
    } catch (error) {
      logger.error('Erreur calcul score prospect', error);
      throw error;
    }
  }

  /**
   * Convertir un prospect en client
   */
  static async convertirEnClient(prospectId: string, companyId: string) {
    try {
      const prospect = await prisma.prospect.findFirst({
        where: { id: prospectId, companyId },
      });

      if (!prospect) throw new Error('Prospect non trouvé');

      // Créer le client
      const client = await prisma.client.create({
        data: {
          companyId,
          nom: prospect.entreprise || `${prospect.nom} ${prospect.prenom || ''}`.trim(),
          email: prospect.email,
          telephone: prospect.telephone,
          adresse: prospect.adresse,
          ville: prospect.ville,
          pays: prospect.pays,
          type: prospect.entreprise ? 'ENTREPRISE' : 'PARTICULIER',
          notes: prospect.notes,
        },
      });

      // Mettre à jour le prospect
      await prisma.prospect.update({
        where: { id: prospectId },
        data: {
          statut: 'GAGNE',
          clientId: client.id,
        },
      });

      logger.info(`Prospect ${prospectId} converti en client ${client.id}`);
      return client;
    } catch (error) {
      logger.error('Erreur conversion prospect en client', error);
      throw error;
    }
  }

  // ==================== OPPORTUNITÉS ====================

  /**
   * Créer une opportunité
   */
  static async creerOpportunite(companyId: string, data: {
    prospectId: string;
    nom: string;
    description?: string;
    montant?: number;
    probabilite?: number;
    etape?: string;
    dateCloturePrevue?: Date;
    source?: string;
  }) {
    try {
      const opportunite = await prisma.opportunite.create({
        data: {
          companyId,
          prospectId: data.prospectId,
          nom: data.nom,
          description: data.description,
          montant: data.montant || 0,
          probabilite: data.probabilite || 0,
          etape: data.etape || 'PROSPECTION',
          statut: 'EN_COURS',
          dateCloturePrevue: data.dateCloturePrevue,
          source: data.source,
        },
      });

      // Mettre à jour le statut du prospect
      await this.mettreAJourStatutProspect(data.prospectId, companyId, 'PROPOSITION');

      logger.info(`Opportunité créée: ${opportunite.id}`);
      return opportunite;
    } catch (error) {
      logger.error('Erreur création opportunité', error);
      throw error;
    }
  }

  /**
   * Lister les opportunités
   */
  static async listerOpportunites(
    companyId: string,
    filters?: {
      statut?: string;
      etape?: string;
      prospectId?: string;
    },
    pagination?: { page: number; limit: number }
  ) {
    try {
      const where: any = { companyId };
      if (filters?.statut) where.statut = filters.statut;
      if (filters?.etape) where.etape = filters.etape;
      if (filters?.prospectId) where.prospectId = filters.prospectId;

      const total = await prisma.opportunite.count({ where });
      const opportunites = await prisma.opportunite.findMany({
        where,
        include: {
          prospect: true,
          devis: true,
          activites: { take: 5, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
      });

      return {
        data: opportunites,
        total,
        page: pagination?.page || 1,
        limit: pagination?.limit || total,
      };
    } catch (error) {
      logger.error('Erreur liste opportunités', error);
      throw error;
    }
  }

  /**
   * Mettre à jour l'étape d'une opportunité (pipeline)
   */
  static async mettreAJourEtape(
    opportuniteId: string,
    companyId: string,
    nouvelleEtape: string,
    probabilite?: number
  ) {
    try {
      const opportunite = await prisma.opportunite.update({
        where: { id: opportuniteId, companyId },
        data: {
          etape: nouvelleEtape,
          probabilite: probabilite,
        },
      });

      logger.info(`Opportunité ${opportuniteId} déplacée à l'étape ${nouvelleEtape}`);
      return opportunite;
    } catch (error) {
      logger.error('Erreur mise à jour étape opportunité', error);
      throw error;
    }
  }

  /**
   * Gagner une opportunité
   */
  static async gagnerOpportunite(opportuniteId: string, companyId: string) {
    try {
      const opportunite = await prisma.opportunite.findFirst({
        where: { id: opportuniteId, companyId },
        include: { prospect: true },
      });

      if (!opportunite) throw new Error('Opportunité non trouvée');

      // Convertir le prospect en client
      const client = await this.convertirEnClient(opportunite.prospectId, companyId);

      // Mettre à jour l'opportunité
      await prisma.opportunite.update({
        where: { id: opportuniteId },
        data: {
          statut: 'GAGNEE',
          dateCloture: new Date(),
          probabilite: 100,
          clientId: client.id,
        },
      });

      logger.info(`Opportunité ${opportuniteId} gagnée`);
      return client;
    } catch (error) {
      logger.error('Erreur gain opportunité', error);
      throw error;
    }
  }

  /**
   * Perdre une opportunité
   */
  static async perdreOpportunite(
    opportuniteId: string,
    companyId: string,
    raison?: string,
    concurrent?: string
  ) {
    try {
      const opportunite = await prisma.opportunite.update({
        where: { id: opportuniteId, companyId },
        data: {
          statut: 'PERDUE',
          dateCloture: new Date(),
          probabilite: 0,
          raisonPerte: raison,
          concurrent: concurrent,
        },
      });

      logger.info(`Opportunité ${opportuniteId} perdue: ${raison}`);
      return opportunite;
    } catch (error) {
      logger.error('Erreur perte opportunité', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques du pipeline
   */
  static async getPipelineStats(companyId: string) {
    try {
      const opportunites = await prisma.opportunite.findMany({
        where: { companyId, statut: 'EN_COURS' },
      });

      const etapes = [
        { etape: 'PROSPECTION', label: 'Prospection', montant: 0, count: 0 },
        { etape: 'QUALIFICATION', label: 'Qualification', montant: 0, count: 0 },
        { etape: 'PROPOSITION', label: 'Proposition', montant: 0, count: 0 },
        { etape: 'NEGOCIATION', label: 'Négociation', montant: 0, count: 0 },
        { etape: 'CLOSURE', label: 'Closure', montant: 0, count: 0 },
      ];

      let totalPipeline = 0;
      let ponderePipeline = 0;

      for (const opp of opportunites) {
        const etape = etapes.find(e => e.etape === opp.etape);
        if (etape) {
          etape.montant += opp.montant;
          etape.count++;
        }
        totalPipeline += opp.montant;
        ponderePipeline += (opp.montant * opp.probabilite) / 100;
      }

      return {
        etapes,
        totalPipeline,
        ponderePipeline,
        nombreOpportunites: opportunites.length,
      };
    } catch (error) {
      logger.error('Erreur stats pipeline', error);
      throw error;
    }
  }

  // ==================== ACTIVITÉS ====================

  /**
   * Créer une activité
   */
  static async creerActivite(companyId: string, data: {
    prospectId?: string;
    opportuniteId?: string;
    type: string;
    titre: string;
    description?: string;
    dateDebut: Date;
    dateFin?: Date;
    priorite?: string;
    assigneA?: string;
    creePar?: string;
    rappel?: boolean;
    dateRappel?: Date;
  }) {
    try {
      const activite = await prisma.activiteCRM.create({
        data: {
          companyId,
          prospectId: data.prospectId,
          opportuniteId: data.opportuniteId,
          type: data.type,
          titre: data.titre,
          description: data.description,
          dateDebut: data.dateDebut,
          dateFin: data.dateFin,
          statut: 'PLANIFIE',
          priorite: data.priorite || 'NORMALE',
          assigneA: data.assigneA,
          creePar: data.creePar,
          rappel: data.rappel || false,
          dateRappel: data.dateRappel,
        },
      });

      // Mettre à jour dernier contact du prospect
      if (data.prospectId) {
        await prisma.prospect.update({
          where: { id: data.prospectId },
          data: { dernierContact: new Date() },
        });
      }

      logger.info(`Activité créée: ${activite.id}`);
      return activite;
    } catch (error) {
      logger.error('Erreur création activité', error);
      throw error;
    }
  }

  /**
   * Lister les activités
   */
  static async listerActivites(
    companyId: string,
    filters?: {
      type?: string;
      statut?: string;
      prospectId?: string;
      opportuniteId?: string;
      assigneA?: string;
      dateDebut?: Date;
      dateFin?: Date;
    },
    pagination?: { page: number; limit: number }
  ) {
    try {
      const where: any = { companyId };
      if (filters?.type) where.type = filters.type;
      if (filters?.statut) where.statut = filters.statut;
      if (filters?.prospectId) where.prospectId = filters.prospectId;
      if (filters?.opportuniteId) where.opportuniteId = filters.opportuniteId;
      if (filters?.assigneA) where.assigneA = filters.assigneA;
      if (filters?.dateDebut || filters?.dateFin) {
        where.dateDebut = {};
        if (filters?.dateDebut) where.dateDebut.gte = filters.dateDebut;
        if (filters?.dateFin) where.dateDebut.lte = filters.dateFin;
      }

      const total = await prisma.activiteCRM.count({ where });
      const activites = await prisma.activiteCRM.findMany({
        where,
        include: {
          prospect: { select: { id: true, nom: true, entreprise: true } },
          opportunite: { select: { id: true, nom: true, montant: true } },
        },
        orderBy: { dateDebut: 'desc' },
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
      });

      return {
        data: activites,
        total,
        page: pagination?.page || 1,
        limit: pagination?.limit || total,
      };
    } catch (error) {
      logger.error('Erreur liste activités', error);
      throw error;
    }
  }

  /**
   * Terminer une activité
   */
  static async terminerActivite(activiteId: string, companyId: string, resultat?: string) {
    try {
      const activite = await prisma.activiteCRM.update({
        where: { id: activiteId, companyId },
        data: {
          statut: 'TERMINE',
          resultat: resultat,
        },
      });

      logger.info(`Activité ${activiteId} terminée`);
      return activite;
    } catch (error) {
      logger.error('Erreur terminaison activité', error);
      throw error;
    }
  }

  // ==================== PIPELINE CONFIG ====================

  /**
   * Créer un pipeline de vente par défaut
   */
  static async creerPipelineDefaut(companyId: string) {
    try {
      const pipeline = await prisma.pipelineVente.create({
        data: {
          companyId,
          nom: 'Pipeline par défaut',
          description: 'Pipeline de vente standard',
          ordre: 1,
          etapes: {
            create: [
              { nom: 'Prospection', probabilite: 10, couleur: '#94a3b8', ordre: 1 },
              { nom: 'Qualification', probabilite: 25, couleur: '#fbbf24', ordre: 2 },
              { nom: 'Proposition', probabilite: 50, couleur: '#60a5fa', ordre: 3 },
              { nom: 'Négociation', probabilite: 75, couleur: '#a78bfa', ordre: 4 },
              { nom: 'Closure', probabilite: 90, couleur: '#34d399', ordre: 5 },
            ],
          },
        },
        include: { etapes: true },
      });

      logger.info(`Pipeline par défaut créé pour ${companyId}`);
      return pipeline;
    } catch (error) {
      logger.error('Erreur création pipeline par défaut', error);
      throw error;
    }
  }

  /**
   * Obtenir le dashboard CRM
   */
  static async getDashboard(companyId: string) {
    try {
      const [
        totalProspects,
        prospectsParStatut,
        prospectsParSource,
        opportunitesActives,
        activitesAujourdhui,
        pipelineStats,
      ] = await Promise.all([
        prisma.prospect.count({ where: { companyId } }),
        prisma.prospect.groupBy({
          by: ['statut'],
          where: { companyId },
          _count: true,
        }),
        prisma.prospect.groupBy({
          by: ['source'],
          where: { companyId },
          _count: true,
        }),
        prisma.opportunite.count({
          where: { companyId, statut: 'EN_COURS' },
        }),
        prisma.activiteCRM.count({
          where: {
            companyId,
            statut: 'PLANIFIE',
            dateDebut: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        this.getPipelineStats(companyId),
      ]);

      return {
        totalProspects,
        prospectsParStatut: prospectsParStatut.map(p => ({
          statut: p.statut,
          count: p._count,
        })),
        prospectsParSource: prospectsParSource.map(p => ({
          source: p.source || 'Non spécifié',
          count: p._count,
        })),
        opportunitesActives,
        activitesAujourdhui,
        pipelineStats,
      };
    } catch (error) {
      logger.error('Erreur dashboard CRM', error);
      throw error;
    }
  }
}

export default CRMService;
