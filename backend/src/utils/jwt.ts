import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'guineamanager-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

export interface UserPayload {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  companyId: string;
}

export const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
};
