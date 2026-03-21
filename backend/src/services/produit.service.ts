// Produit Service for GuinéaManager ERP

import prisma from '../utils/database';
import { CreateProduitInput, UpdateProduitInput, produitFilterSchema } from '../utils/validation';
import { NotFoundError, ConflictError } from '../middlewares/error.middleware';
import { z } from 'zod';

/**
 * Create a new product
 */
export const createProduit = async (
  companyId: string,
  data: CreateProduitInput
) => {
  const produit = await prisma.produit.create({
    data: {
      ...data,
      companyId,
    },
  });

  return produit;
};

/**
 * Get all products with pagination and filtering
 */
export const getProduits = async (
  companyId: string,
  params: z.infer<typeof produitFilterSchema>
) => {
  const { page, limit, search, categorie, actif } = params;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(search && {
      OR: [
        { nom: { contains: search } },
        { description: { contains: search } },
      ],
    }),
    ...(categorie && { categorie }),
    ...(actif !== undefined && { actif }),
  };

  const [produits, total] = await Promise.all([
    prisma.produit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.produit.count({ where }),
  ]);

  return {
    data: produits,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get product by ID
 */
export const getProduitById = async (companyId: string, produitId: string) => {
  const produit = await prisma.produit.findFirst({
    where: {
      id: produitId,
      companyId,
    },
  });

  if (!produit) {
    throw new NotFoundError('Produit non trouvé');
  }

  return produit;
};

/**
 * Update product
 */
export const updateProduit = async (
  companyId: string,
  produitId: string,
  data: UpdateProduitInput
) => {
  // Verify product exists and belongs to company
  const existingProduit = await prisma.produit.findFirst({
    where: { id: produitId, companyId },
  });

  if (!existingProduit) {
    throw new NotFoundError('Produit non trouvé');
  }

  const produit = await prisma.produit.update({
    where: { id: produitId },
    data,
  });

  return produit;
};

/**
 * Delete product
 */
export const deleteProduit = async (companyId: string, produitId: string) => {
  // Verify product exists and belongs to company
  const existingProduit = await prisma.produit.findFirst({
    where: { id: produitId, companyId },
    include: {
      _count: {
        select: { lignesFacture: true },
      },
    },
  });

  if (!existingProduit) {
    throw new NotFoundError('Produit non trouvé');
  }

  if (existingProduit._count.lignesFacture > 0) {
    throw new ConflictError(
      'Impossible de supprimer ce produit car il est utilisé dans des factures'
    );
  }

  await prisma.produit.delete({
    where: { id: produitId },
  });

  return true;
};

/**
 * Get products with low stock
 */
export const getProduitsStockBas = async (companyId: string) => {
  const produits = await prisma.produit.findMany({
    where: {
      companyId,
      actif: true,
      stockActuel: { lte: prisma.produit.fields.stockMin },
    },
    orderBy: { stockActuel: 'asc' },
  });

  return produits;
};

/**
 * Update product stock
 */
export const updateStock = async (
  produitId: string,
  quantite: number,
  operation: 'add' | 'subtract'
) => {
  const produit = await prisma.produit.findUnique({
    where: { id: produitId },
    select: { stockActuel: true },
  });

  if (!produit) {
    throw new NotFoundError('Produit non trouvé');
  }

  const newStock =
    operation === 'add'
      ? produit.stockActuel + quantite
      : produit.stockActuel - quantite;

  if (newStock < 0) {
    throw new ConflictError('Stock insuffisant');
  }

  await prisma.produit.update({
    where: { id: produitId },
    data: { stockActuel: newStock },
  });
};

/**
 * Get product categories
 */
export const getCategories = async (companyId: string) => {
  const categories = await prisma.produit.groupBy({
    by: ['categorie'],
    where: {
      companyId,
      categorie: { not: null },
    },
    _count: { id: true },
  });

  return categories
    .filter((c) => c.categorie)
    .map((item) => ({
      nom: item.categorie,
      count: item._count.id,
    }));
};

/**
 * Get product statistics
 */
export const getProduitStats = async (companyId: string) => {
  const [totalProduits, produitsActifs, produitsStockBas, categories] =
    await Promise.all([
      prisma.produit.count({ where: { companyId } }),
      prisma.produit.count({ where: { companyId, actif: true } }),
      prisma.produit.count({
        where: {
          companyId,
          actif: true,
          stockActuel: { lte: prisma.produit.fields.stockMin },
        },
      }),
      getCategories(companyId),
    ]);

  return {
    totalProduits,
    produitsActifs,
    produitsInactifs: totalProduits - produitsActifs,
    produitsStockBas,
    categories,
  };
};
