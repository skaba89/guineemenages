import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../index';
import { generateToken } from '../utils/jwt';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
});

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères'),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  telephone: z.string().optional(),
  companyName: z.string().min(1, 'Nom d\'entreprise requis'),
  pays: z.string().optional(),
  codePays: z.string().optional()
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user || !user.actif) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { dernierLogin: new Date() }
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      companyId: user.companyId
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          telephone: user.telephone,
          role: user.role,
          company: user.company
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, nom, prenom, telephone, companyName, pays, codePays } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un compte existe déjà avec cet email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine country config
    const countryCode = codePays || 'GN';
    const countryName = pays || 'Guinée';
    const isXOF = ['SN', 'ML', 'CI', 'BF', 'BJ', 'NE'].includes(countryCode);

    // Create company and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company with default plan
      const company = await tx.company.create({
        data: {
          nom: companyName,
          email: email,
          telephone: telephone || null,
          pays: countryName,
          codePays: countryCode,
          devise: isXOF ? 'XOF' : 'GNF',
          symboleDevise: isXOF ? 'FCFA' : 'GNF',
          planId: 'petite', // Default to free plan
          dateDebutAbonnement: new Date(),
          dateFinAbonnement: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year trial
        }
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          nom,
          prenom,
          telephone: telephone || null,
          role: 'ADMIN',
          companyId: company.id,
          emailVerifie: false
        },
        include: { company: true }
      });

      return user;
    });

    const token = generateToken({
      id: result.id,
      email: result.email,
      nom: result.nom,
      prenom: result.prenom,
      role: result.role,
      companyId: result.companyId
    });

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        token,
        user: {
          id: result.id,
          email: result.email,
          nom: result.nom,
          prenom: result.prenom,
          telephone: result.telephone,
          role: result.role,
          company: result.company
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { 
        company: {
          include: { planAbonnement: true }
        } 
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  res.json({ success: true, message: 'Déconnexion réussie' });
});

export default router;
