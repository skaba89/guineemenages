// Zod Validation Schemas for GuinéaManager ERP

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const idSchema = z.string().cuid();

export const emailSchema = z.string().email('Email invalide');

export const phoneSchema = z.string().min(8).max(20).optional();

export const dateSchema = z.coerce.date();

export const amountSchema = z.number().int().nonnegative('Le montant doit être positif');

// ============================================
// Auth Schemas
// ============================================

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  telephone: phoneSchema,
  role: z.enum(['admin', 'manager', 'comptable', 'user']).default('user'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
});

// ============================================
// Company Schemas
// ============================================

export const createCompanySchema = z.object({
  nom: z.string().min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères'),
  email: emailSchema.optional(),
  telephone: phoneSchema,
  adresse: z.string().max(200).optional(),
  ville: z.string().max(100).optional(),
  pays: z.string().default('Guinée'),
  ninea: z.string().max(50).optional(),
  logo: z.string().url().optional(),
  plan: z.enum(['basic', 'standard', 'premium']).default('basic'),
  devise: z.string().default('GNF'),
});

export const updateCompanySchema = createCompanySchema.partial();

// ============================================
// Client Schemas
// ============================================

export const createClientSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: emailSchema,
  telephone: phoneSchema,
  adresse: z.string().max(200).optional(),
  ville: z.string().max(100).optional(),
  pays: z.string().default('Guinée'),
  type: z.enum(['particulier', 'entreprise']).default('particulier'),
});

export const updateClientSchema = createClientSchema.partial();

export const clientFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  type: z.enum(['particulier', 'entreprise']).optional(),
});

// ============================================
// Produit Schemas
// ============================================

export const createProduitSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().max(500).optional(),
  prixUnitaire: amountSchema,
  unite: z.string().default('unité'),
  stockActuel: z.number().int().nonnegative().default(0),
  stockMin: z.number().int().nonnegative().default(0),
  categorie: z.string().max(100).optional(),
});

export const updateProduitSchema = createProduitSchema.partial().extend({
  actif: z.boolean().optional(),
});

export const produitFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  categorie: z.string().optional(),
  actif: z.coerce.boolean().optional(),
});

// ============================================
// Facture Schemas
// ============================================

export const ligneFactureSchema = z.object({
  produitId: z.string().cuid().optional(),
  description: z.string().min(1, 'La description est requise'),
  quantite: z.number().positive('La quantité doit être positive'),
  prixUnitaire: amountSchema,
  tauxTVA: z.number().nonnegative().max(100).default(0),
});

export const createFactureSchema = z.object({
  clientId: z.string().cuid('ID client invalide'),
  dateEmission: dateSchema.optional(),
  dateEcheance: dateSchema.optional(),
  modePaiement: z.enum(['especes', 'virement', 'cheque', 'mobile_money']).optional(),
  notes: z.string().max(500).optional(),
  lignes: z.array(ligneFactureSchema).min(1, 'Au moins une ligne est requise'),
});

export const updateFactureSchema = createFactureSchema.partial().extend({
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'annulee']).optional(),
  lignes: z.array(ligneFactureSchema).min(1, 'Au moins une ligne est requise').optional(),
});

export const factureFilterSchema = paginationSchema.extend({
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'annulee']).optional(),
  clientId: z.string().cuid().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

// ============================================
// Employe Schemas
// ============================================

export const createEmployeSchema = z.object({
  matricule: z.string().min(1, 'Le matricule est requis'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: emailSchema,
  telephone: phoneSchema,
  adresse: z.string().max(200).optional(),
  dateNaissance: dateSchema.optional(),
  dateEmbauche: dateSchema.optional(),
  poste: z.string().max(100).optional(),
  departement: z.string().max(100).optional(),
  salaireBase: amountSchema,
  typeContrat: z.enum(['cdi', 'cdd', 'stage', 'apprentissage']).default('cdi'),
});

export const updateEmployeSchema = createEmployeSchema.partial().extend({
  dateDepart: dateSchema.optional().nullable(),
  actif: z.boolean().optional(),
});

export const employeFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  departement: z.string().optional(),
  actif: z.coerce.boolean().optional(),
});

// ============================================
// Bulletin Paie Schemas
// ============================================

export const createBulletinPaieSchema = z.object({
  employeId: z.string().cuid('ID employé invalide'),
  mois: z.number().int().min(1).max(12),
  annee: z.number().int().min(2020).max(2100),
  heuresSupplementaires: z.number().nonnegative().default(0),
  primes: amountSchema.default(0),
  indemnites: amountSchema.default(0),
  autresAvantages: amountSchema.default(0),
  acomptes: amountSchema.default(0),
  autreRetenues: amountSchema.default(0),
});

export const updateBulletinPaieSchema = createBulletinPaieSchema.partial().extend({
  statut: z.enum(['brouillon', 'valide', 'paye']).optional(),
  datePaiement: dateSchema.optional(),
});

export const calculerPaieSchema = z.object({
  salaireBase: amountSchema,
  heuresSupplementaires: z.number().nonnegative().default(0),
  tauxHoraire: amountSchema.optional(),
  primes: amountSchema.default(0),
  indemnites: amountSchema.default(0),
  autresAvantages: amountSchema.default(0),
  acomptes: amountSchema.default(0),
  autreRetenues: amountSchema.default(0),
});

// ============================================
// Depense Schemas
// ============================================

export const createDepenseSchema = z.object({
  description: z.string().min(2, 'La description doit contenir au moins 2 caractères'),
  montant: amountSchema,
  categorie: z.string().max(100).optional(),
  date: dateSchema.optional(),
  modePaiement: z.enum(['especes', 'virement', 'cheque', 'mobile_money']).optional(),
  notes: z.string().max(500).optional(),
});

export const updateDepenseSchema = createDepenseSchema.partial();

export const depenseFilterSchema = paginationSchema.extend({
  categorie: z.string().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

// ============================================
// Type exports from schemas
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateProduitInput = z.infer<typeof createProduitSchema>;
export type UpdateProduitInput = z.infer<typeof updateProduitSchema>;
export type CreateFactureInput = z.infer<typeof createFactureSchema>;
export type UpdateFactureInput = z.infer<typeof updateFactureSchema>;
export type CreateEmployeInput = z.infer<typeof createEmployeSchema>;
export type UpdateEmployeInput = z.infer<typeof updateEmployeSchema>;
export type CreateBulletinPaieInput = z.infer<typeof createBulletinPaieSchema>;
export type UpdateBulletinPaieInput = z.infer<typeof updateBulletinPaieSchema>;
export type CreateDepenseInput = z.infer<typeof createDepenseSchema>;
export type UpdateDepenseInput = z.infer<typeof updateDepenseSchema>;
export type CalculerPaieInput = z.infer<typeof calculerPaieSchema>;
