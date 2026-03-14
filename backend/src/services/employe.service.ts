// Employe Service for GuinéaManager ERP

import prisma from '../utils/database';
import { CreateEmployeInput, UpdateEmployeInput, employeFilterSchema } from '../utils/validation';
import { NotFoundError, ConflictError } from '../middlewares/error.middleware';
import { z } from 'zod';

/**
 * Generate employee matricule
 */
export const generateMatricule = async (companyId: string): Promise<string> => {
  const prefix = 'EMP-';

  const lastEmploye = await prisma.employe.findFirst({
    where: {
      companyId,
      matricule: { startsWith: prefix },
    },
    orderBy: { matricule: 'desc' },
    select: { matricule: true },
  });

  let sequence = 1;
  if (lastEmploye) {
    const lastNumber = lastEmploye.matricule.split('-')[1];
    sequence = parseInt(lastNumber, 10) + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
};

/**
 * Create a new employee
 */
export const createEmploye = async (
  companyId: string,
  data: CreateEmployeInput
) => {
  // Check if matricule already exists
  if (data.matricule) {
    const existingEmploye = await prisma.employe.findUnique({
      where: { matricule: data.matricule },
    });

    if (existingEmploye) {
      throw new ConflictError('Un employé avec ce matricule existe déjà');
    }
  }

  const employe = await prisma.employe.create({
    data: {
      ...data,
      matricule: data.matricule || (await generateMatricule(companyId)),
      companyId,
    },
  });

  return employe;
};

/**
 * Get all employees with pagination and filtering
 */
export const getEmployes = async (
  companyId: string,
  params: z.infer<typeof employeFilterSchema>
) => {
  const { page, limit, search, departement, actif } = params;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(search && {
      OR: [
        { nom: { contains: search } },
        { prenom: { contains: search } },
        { matricule: { contains: search } },
        { email: { contains: search } },
      ],
    }),
    ...(departement && { departement }),
    ...(actif !== undefined && { actif }),
  };

  const [employes, total] = await Promise.all([
    prisma.employe.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ actif: 'desc' }, { nom: 'asc' }],
    }),
    prisma.employe.count({ where }),
  ]);

  return {
    data: employes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get employee by ID
 */
export const getEmployeById = async (companyId: string, employeId: string) => {
  const employe = await prisma.employe.findFirst({
    where: {
      id: employeId,
      companyId,
    },
    include: {
      bulletins: {
        orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
        take: 12,
      },
      _count: {
        select: { bulletins: true },
      },
    },
  });

  if (!employe) {
    throw new NotFoundError('Employé non trouvé');
  }

  return employe;
};

/**
 * Update employee
 */
export const updateEmploye = async (
  companyId: string,
  employeId: string,
  data: UpdateEmployeInput
) => {
  // Verify employee exists and belongs to company
  const existingEmploye = await prisma.employe.findFirst({
    where: { id: employeId, companyId },
  });

  if (!existingEmploye) {
    throw new NotFoundError('Employé non trouvé');
  }

  // Check if matricule is being changed and already exists
  if (data.matricule && data.matricule !== existingEmploye.matricule) {
    const matriculeExists = await prisma.employe.findUnique({
      where: { matricule: data.matricule },
    });

    if (matriculeExists) {
      throw new ConflictError('Un employé avec ce matricule existe déjà');
    }
  }

  const employe = await prisma.employe.update({
    where: { id: employeId },
    data,
  });

  return employe;
};

/**
 * Deactivate employee
 */
export const deactivateEmploye = async (
  companyId: string,
  employeId: string,
  dateDepart?: Date
) => {
  const employe = await prisma.employe.findFirst({
    where: { id: employeId, companyId },
  });

  if (!employe) {
    throw new NotFoundError('Employé non trouvé');
  }

  const updatedEmploye = await prisma.employe.update({
    where: { id: employeId },
    data: {
      actif: false,
      dateDepart: dateDepart || new Date(),
    },
  });

  return updatedEmploye;
};

/**
 * Get employees by department
 */
export const getEmployesByDepartement = async (companyId: string) => {
  const result = await prisma.employe.groupBy({
    by: ['departement'],
    where: {
      companyId,
      actif: true,
    },
    _count: { id: true },
    _sum: { salaireBase: true },
  });

  return result.map((item) => ({
    departement: item.departement || 'Non assigné',
    count: item._count.id,
    masseSalariale: item._sum.salaireBase || 0,
  }));
};

/**
 * Get employee statistics
 */
export const getEmployeStats = async (companyId: string) => {
  const [
    totalEmployes,
    employesActifs,
    employesParDepartement,
    masseSalariale,
  ] = await Promise.all([
    prisma.employe.count({ where: { companyId } }),
    prisma.employe.count({ where: { companyId, actif: true } }),
    getEmployesByDepartement(companyId),
    prisma.employe.aggregate({
      where: { companyId, actif: true },
      _sum: { salaireBase: true },
    }),
  ]);

  return {
    totalEmployes,
    employesActifs,
    employesInactifs: totalEmployes - employesActifs,
    employesParDepartement,
    masseSalarialeMensuelle: masseSalariale._sum.salaireBase || 0,
  };
};

/**
 * Get all departments
 */
export const getDepartements = async (companyId: string) => {
  const result = await prisma.employe.findMany({
    where: {
      companyId,
      departement: { not: null },
    },
    select: { departement: true },
    distinct: ['departement'],
  });

  return result
    .filter((e) => e.departement)
    .map((e) => e.departement);
};
