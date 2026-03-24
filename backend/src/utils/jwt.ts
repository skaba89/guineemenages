import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'guineamanager-secret-key-2024';
const JWT_EXPIRES_IN = '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';

export interface UserPayload {
  id: string;
  userId?: string; // alias for id
  email: string;
  nom: string;
  prenom: string;
  role: string;
  companyId: string;
}

/**
 * Generate a JWT token for a user
 */
export const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Alias for generateToken
 */
export const signToken = generateToken;

/**
 * Generate a refresh token
 */
export const generateRefreshToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
};

/**
 * Alias for verifyToken - for access token verification
 */
export const verifyAccessToken = verifyToken;

/**
 * Verify and decode a refresh token
 */
export const verifyRefreshToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): UserPayload | null => {
  try {
    return jwt.decode(token) as UserPayload;
  } catch {
    return null;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
};

export default {
  generateToken,
  signToken,
  generateRefreshToken,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
};
