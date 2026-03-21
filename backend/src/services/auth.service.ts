// Authentication Service for GuinéaManager ERP

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../utils/database';
import { signToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../utils/validation';
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from '../middlewares/error.middleware';
import { AuthUser, UserRole } from '../types';
import { sendWelcomeEmail, sendVerificationEmail } from '../utils/email';

const SALT_ROUNDS = 12;

/**
 * Register a new user with company
 */
export const registerWithCompany = async (
  userData: RegisterInput & { companyNom: string }
): Promise<{ user: AuthUser; token: string }> => {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new ConflictError('Un utilisateur avec cet email existe déjà');
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create company and user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create company
    const company = await tx.company.create({
      data: {
        nom: userData.companyNom,
        email: userData.email,
      },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user (first user is always admin)
    const user = await tx.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        nom: userData.nom,
        prenom: userData.prenom,
        telephone: userData.telephone,
        role: 'admin',
        companyId: company.id,
        verificationToken,
        verificationTokenExpiry,
      },
    });

    return { user, company };
  });

  const user: AuthUser = {
    id: result.user.id,
    email: result.user.email,
    nom: result.user.nom,
    prenom: result.user.prenom,
    role: result.user.role as UserRole,
    companyId: result.company.id,
  };

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  // Send emails (non-blocking)
  try {
    await sendWelcomeEmail(user.email, user.nom, user.prenom, result.company.nom);
    await sendVerificationEmail(user.email, verificationToken, user.prenom);
  } catch (error) {
    console.error('Failed to send registration emails:', error);
    // Don't fail registration if email fails
  }

  return { user, token };
};

/**
 * Register a new user (requires existing company)
 */
export const register = async (
  userData: RegisterInput,
  companyId: string
): Promise<{ user: AuthUser; token: string }> => {
  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new NotFoundError('Entreprise non trouvée');
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new ConflictError('Un utilisateur avec cet email existe déjà');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      nom: userData.nom,
      prenom: userData.prenom,
      telephone: userData.telephone,
      role: userData.role,
      companyId,
    },
  });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role as UserRole,
    companyId: user.companyId,
  };

  const token = signToken({
    userId: authUser.id,
    email: authUser.email,
    role: authUser.role,
    companyId: authUser.companyId,
  });

  return { user: authUser, token };
};

/**
 * Login user
 */
export const login = async (credentials: LoginInput): Promise<{ user: AuthUser; token: string }> => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    include: { company: true },
  });

  if (!user) {
    throw new UnauthorizedError('Email ou mot de passe incorrect');
  }

  if (!user.actif) {
    throw new UnauthorizedError('Votre compte a été désactivé');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Email ou mot de passe incorrect');
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role as UserRole,
    companyId: user.companyId,
  };

  const token = signToken({
    userId: authUser.id,
    email: authUser.email,
    role: authUser.role,
    companyId: authUser.companyId,
  });

  return { user: authUser, token };
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (userId: string): Promise<AuthUser & { company: { id: string; nom: string; devise: string } }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: {
        select: { id: true, nom: true, devise: true },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  return {
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role as UserRole,
    companyId: user.companyId,
    company: user.company,
  };
};

/**
 * Update user password
 */
export const updatePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Mot de passe actuel incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

/**
 * Create default admin user (for initial setup)
 */
export const createDefaultAdmin = async (): Promise<void> => {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@guineamanager.com';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    return; // Admin already exists
  }

  // Create default company
  const company = await prisma.company.create({
    data: {
      nom: 'GuinéaManager Demo',
      email: adminEmail,
      plan: 'premium',
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      nom: 'Admin',
      prenom: 'System',
      role: 'admin',
      companyId: company.id,
    },
  });

  console.log('Default admin user created:', adminEmail);
};
