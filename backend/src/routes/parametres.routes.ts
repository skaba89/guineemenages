import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware } from '../middlewares/auth.middleware';
import { LISTE_PAYS, getConfigPays } from '../config/countries';

const router = Router();
router.use(authMiddleware);

// ============================================================================
// INFORMATIONS SOCIÉTÉ
// ============================================================================

// GET /api/parametres/societe
router.get('/societe', async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      include: { 
        planAbonnement: true,
        users: {
          select: { id: true, nom: true, prenom: true, email: true, role: true, actif: true }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Société non trouvée' });
    }

    res.json({
      success: true,
      data: {
        id: company.id,
        nom: company.nom,
        email: company.email,
        telephone: company.telephone,
        adresse: company.adresse,
        ville: company.ville,
        pays: company.pays,
        codePays: company.codePays,
        ninea: company.ninea,
        logo: company.logo,
        devise: company.devise,
        symboleDevise: company.symboleDevise,
        langue: company.langue,
        fuseauHoraire: company.fuseauHoraire,
        formatDateTime: company.formatDateTime,
        plan: company.planAbonnement,
        notificationEmail: company.notificationEmail,
        notificationSMS: company.notificationSMS,
        configTauxCNSSEmploye: company.configTauxCNSSEmploye,
        configTauxCNSSEmployeur: company.configTauxCNSSEmployeur,
        configPlafondCNSS: company.configPlafondCNSS,
        configTauxTVA: company.configTauxTVA,
        dateDebutAbonnement: company.dateDebutAbonnement,
        dateFinAbonnement: company.dateFinAbonnement,
        createdAt: company.createdAt,
        utilisateurs: company.users
      }
    });
  } catch (error) {
    console.error('Get société error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/parametres/societe
router.put('/societe', async (req: Request, res: Response) => {
  try {
    const {
      nom,
      email,
      telephone,
      adresse,
      ville,
      pays,
      codePays,
      ninea,
      logo,
      notificationEmail,
      notificationSMS
    } = req.body;

    // Vérifier si le pays est supporté
    if (codePays) {
      const configPays = getConfigPays(codePays);
      if (!configPays) {
        return res.status(400).json({ 
          success: false, 
          message: `Pays non supporté. Pays supportés: ${LISTE_PAYS.map(p => p.nom).join(', ')}` 
        });
      }
    }

    const company = await prisma.company.update({
      where: { id: req.user!.companyId },
      data: {
        nom,
        email,
        telephone,
        adresse,
        ville,
        pays: pays || (codePays ? LISTE_PAYS.find(p => p.code === codePays)?.nom : undefined),
        codePays,
        ninea,
        logo,
        notificationEmail,
        notificationSMS
      }
    });

    res.json({ success: true, message: 'Société mise à jour', data: company });
  } catch (error) {
    console.error('Update société error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/parametres/societe/fiscal
router.put('/societe/fiscal', async (req: Request, res: Response) => {
  try {
    const {
      configTauxCNSSEmploye,
      configTauxCNSSEmployeur,
      configPlafondCNSS,
      configTauxTVA
    } = req.body;

    const company = await prisma.company.update({
      where: { id: req.user!.companyId },
      data: {
        configTauxCNSSEmploye,
        configTauxCNSSEmployeur,
        configPlafondCNSS,
        configTauxTVA
      }
    });

    res.json({ success: true, message: 'Configuration fiscale mise à jour', data: company });
  } catch (error) {
    console.error('Update fiscal config error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// PARAMÈTRES PERSONNALISÉS
// ============================================================================

// GET /api/parametres/custom
router.get('/custom', async (req: Request, res: Response) => {
  try {
    const parametres = await prisma.parametreSociete.findMany({
      where: { companyId: req.user!.companyId }
    });

    // Convertir en objet key-value
    const result: Record<string, any> = {};
    parametres.forEach(p => {
      let valeur: any = p.valeur;
      switch (p.type) {
        case 'number':
          valeur = Number(valeur);
          break;
        case 'boolean':
          valeur = valeur === 'true';
          break;
        case 'json':
          try {
            valeur = JSON.parse(valeur);
          } catch (e) {}
          break;
      }
      result[p.cle] = valeur;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get custom params error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/parametres/custom/:cle
router.put('/custom/:cle', async (req: Request, res: Response) => {
  try {
    const { cle } = req.params;
    const { valeur, type = 'string', description } = req.body;

    const parametre = await prisma.parametreSociete.upsert({
      where: {
        companyId_cle: {
          companyId: req.user!.companyId,
          cle
        }
      },
      update: {
        valeur: typeof valeur === 'object' ? JSON.stringify(valeur) : String(valeur),
        type,
        description
      },
      create: {
        companyId: req.user!.companyId,
        cle,
        valeur: typeof valeur === 'object' ? JSON.stringify(valeur) : String(valeur),
        type,
        description
      }
    });

    res.json({ success: true, message: 'Paramètre mis à jour', data: parametre });
  } catch (error) {
    console.error('Update custom param error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/parametres/custom/:cle
router.delete('/custom/:cle', async (req: Request, res: Response) => {
  try {
    const { cle } = req.params;

    await prisma.parametreSociete.delete({
      where: {
        companyId_cle: {
          companyId: req.user!.companyId,
          cle
        }
      }
    });

    res.json({ success: true, message: 'Paramètre supprimé' });
  } catch (error) {
    console.error('Delete custom param error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// PAYS ET DEVISES
// ============================================================================

// GET /api/parametres/pays
router.get('/pays', async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: LISTE_PAYS });
  } catch (error) {
    console.error('Get pays error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/parametres/pays/:code/config
router.get('/pays/:code/config', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const config = getConfigPays(code);

    if (!config) {
      return res.status(404).json({ success: false, message: 'Pays non trouvé' });
    }

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Get pays config error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// UTILISATEURS DE LA SOCIÉTÉ
// ============================================================================

// GET /api/parametres/utilisateurs
router.get('/utilisateurs', async (req: Request, res: Response) => {
  try {
    const utilisateurs = await prisma.user.findMany({
      where: { companyId: req.user!.companyId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        actif: true,
        emailVerifie: true,
        dernierLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: utilisateurs });
  } catch (error) {
    console.error('Get utilisateurs error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/parametres/utilisateurs/:id
router.put('/utilisateurs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nom, prenom, telephone, role, actif } = req.body;

    // Vérifier que l'utilisateur appartient à la même société
    const user = await prisma.user.findFirst({
      where: { id, companyId: req.user!.companyId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { nom, prenom, telephone, role, actif }
    });

    res.json({ success: true, message: 'Utilisateur mis à jour', data: updated });
  } catch (error) {
    console.error('Update utilisateur error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// PROFIL UTILISATEUR COURANT
// ============================================================================

// GET /api/parametres/profil
router.get('/profil', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        avatar: true,
        role: true,
        emailVerifie: true,
        dernierLogin: true,
        preferences: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            nom: true,
            pays: true,
            codePays: true,
            devise: true,
            symboleDevise: true
          }
        }
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profil error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/parametres/profil
router.put('/profil', async (req: Request, res: Response) => {
  try {
    const { nom, prenom, telephone, avatar, preferences } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        nom,
        prenom,
        telephone,
        avatar,
        preferences: preferences ? JSON.stringify(preferences) : undefined
      }
    });

    res.json({ success: true, message: 'Profil mis à jour', data: user });
  } catch (error) {
    console.error('Update profil error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/parametres/profil/password
router.put('/profil/password', async (req: Request, res: Response) => {
  try {
    const { ancienPassword, nouveauPassword } = req.body;
    const bcrypt = require('bcryptjs');

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const validPassword = await bcrypt.compare(ancienPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(nouveauPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Mot de passe mis à jour' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
