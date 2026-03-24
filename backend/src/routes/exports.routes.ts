/**
 * @fileoverview Routes d'export Excel pour GuinéaManager ERP
 * 
 * @module export.routes
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  exportClientsToExcel,
  exportFacturesToExcel,
  exportEmployesToExcel,
  exportBulletinsPaieToExcel,
  exportDepensesToExcel
} from '../utils/excel-export';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/exports/clients
 * Exporte la liste des clients en Excel
 */
router.get('/clients', async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      where: { companyId: req.user!.companyId },
      orderBy: { createdAt: 'desc' }
    });

    const buffer = await exportClientsToExcel(clients);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="clients-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export clients error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'export' });
  }
});

/**
 * GET /api/exports/factures
 * Exporte la liste des factures en Excel
 */
router.get('/factures', async (req: Request, res: Response) => {
  try {
    const { statut, startDate, endDate } = req.query;

    const where: any = { companyId: req.user!.companyId };
    if (statut) where.statut = statut;
    if (startDate || endDate) {
      where.dateEmission = {};
      if (startDate) where.dateEmission.gte = new Date(startDate as string);
      if (endDate) where.dateEmission.lte = new Date(endDate as string);
    }

    const factures = await prisma.facture.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });

    const data = factures.map(f => ({
      numero: f.numero,
      client: f.client.nom,
      dateEmission: f.dateEmission,
      dateEcheance: f.dateEcheance,
      montantHT: f.montantHT,
      montantTVA: f.montantTVA,
      montantTTC: f.montantTTC,
      statut: f.statut
    }));

    const buffer = await exportFacturesToExcel(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="factures-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export factures error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'export' });
  }
});

/**
 * GET /api/exports/employes
 * Exporte la liste des employés en Excel
 */
router.get('/employes', async (req: Request, res: Response) => {
  try {
    const employes = await prisma.employe.findMany({
      where: { companyId: req.user!.companyId },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }]
    });

    const buffer = await exportEmployesToExcel(employes);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="employes-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export employes error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'export' });
  }
});

/**
 * GET /api/exports/paie
 * Exporte les bulletins de paie en Excel
 */
router.get('/paie', async (req: Request, res: Response) => {
  try {
    const { mois, annee } = req.query;

    const where: any = { companyId: req.user!.companyId };
    if (mois) where.mois = Number(mois);
    if (annee) where.annee = Number(annee);

    const bulletins = await prisma.bulletinPaie.findMany({
      where,
      include: { employe: true },
      orderBy: [{ annee: 'desc' }, { mois: 'desc' }]
    });

    const data = bulletins.map(b => ({
      employe: `${b.employe.nom} ${b.employe.prenom}`,
      mois: b.mois,
      annee: b.annee,
      salaireBase: b.salaireBase,
      brutTotal: b.brutTotal,
      cnssEmploye: b.cnssEmploye,
      ipr: b.ipr,
      netAPayer: b.netAPayer,
      statut: b.statut
    }));

    const buffer = await exportBulletinsPaieToExcel(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="paie-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export paie error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'export' });
  }
});

/**
 * GET /api/exports/depenses
 * Exporte la liste des dépenses en Excel
 */
router.get('/depenses', async (req: Request, res: Response) => {
  try {
    const { categorie, startDate, endDate } = req.query;

    const where: any = { companyId: req.user!.companyId };
    if (categorie) where.categorie = categorie;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const depenses = await prisma.depense.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const buffer = await exportDepensesToExcel(depenses);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="depenses-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export depenses error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'export' });
  }
});

export default router;
