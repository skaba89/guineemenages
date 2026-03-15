/**
 * @fileoverview Middleware d'authentification pour l'API GuinéaManager
 * 
 * Ce module fournit les middlewares Express pour l'authentification JWT
 * et le contrôle des accès basés sur les rôles utilisateurs.
 * 
 * @module auth.middleware
 * @author GuinéaManager Team
 * @version 1.0.0
 * 
 * @description
 * Les middlewares d'authentification assurent :
 * - La vérification de la présence du token JWT dans les headers
 * - La validation et le décodage du token
 * - L'injection des informations utilisateur dans la requête
 * - Le contrôle des permissions par rôle
 * 
 * @requires express
 * @requires ../utils/jwt
 * 
 * @example
 * // Utilisation basique
 * router.get('/profil', authMiddleware, (req, res) => {
 *   res.json({ user: req.user });
 * });
 * 
 * @example
 * // Avec contrôle de rôle
 * router.delete('/users/:id', 
 *   authMiddleware, 
 *   requireRole('ADMIN'), 
 *   deleteUserHandler
 * );
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, UserPayload } from '../utils/jwt';

// ============================================================================
// EXTENSION DU TYPE EXPRESS REQUEST
// ============================================================================

/**
 * Extension du type Request d'Express pour inclure les informations utilisateur.
 * 
 * Cette déclaration globale ajoute la propriété `user` au type Request,
 * permettant d'accéder aux informations de l'utilisateur authentifié
 * dans les handlers de route protégés.
 * 
 * @typedef {Object} Request
 * @property {UserPayload} [user] - Informations de l'utilisateur authentifié
 */
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// ============================================================================
// MIDDLEWARES
// ============================================================================

/**
 * Middleware d'authentification JWT.
 * 
 * Ce middleware vérifie la présence et la validité du token JWT
 * dans l'en-tête Authorization de la requête. Si le token est valide,
 * les informations de l'utilisateur sont décodées et attachées à
 * l'objet `req.user` pour les middlewares/handlers suivants.
 * 
 * @function authMiddleware
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 * @param {NextFunction} next - Fonction pour passer au middleware suivant
 * @returns {void|Response} Passe au middleware suivant ou renvoie une erreur 401
 * 
 * @throws {401} Si le header Authorization est manquant
 * @throws {401} Si le token n'est pas au format Bearer
 * @throws {401} Si le token est invalide ou expiré
 * 
 * @example
 * // Protection d'une route
 * router.get('/clients', authMiddleware, getClientsHandler);
 * 
 * // Dans le handler, req.user contient les infos utilisateur
 * const companyId = req.user.companyId;
 * 
 * @example
 * // Format d'en-tête attendu
 * // Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Récupération du header Authorization
  const authHeader = req.headers.authorization;

  // Vérification de la présence du header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Accès non autorisé. Token manquant.'
    });
  }

  // Extraction du token (suppression du préfixe "Bearer ")
  const token = authHeader.split(' ')[1];
  
  // Vérification et décodage du token
  const user = verifyToken(token);

  // Token invalide ou expiré
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré.'
    });
  }

  // Injection des infos utilisateur dans la requête
  req.user = user;
  next();
};

/**
 * Factory de middleware pour le contrôle d'accès par rôle.
 * 
 * Cette fonction retourne un middleware qui vérifie si l'utilisateur
 * authentifié possède l'un des rôles requis pour accéder à la ressource.
 * Doit être utilisé après `authMiddleware` pour que `req.user` soit défini.
 * 
 * @function requireRole
 * @param {...string} roles - Liste des rôles autorisés (ex: 'ADMIN', 'MANAGER')
 * @returns {Function} Middleware Express de vérification de rôle
 * 
 * @throws {403} Si l'utilisateur n'a pas les permissions requises
 * 
 * @example
 * // Route accessible uniquement aux admins
 * router.delete('/users/:id', 
 *   authMiddleware, 
 *   requireRole('ADMIN'), 
 *   deleteUser
 * );
 * 
 * @example
 * // Route accessible aux admins et managers
 * router.post('/factures', 
 *   authMiddleware, 
 *   requireRole('ADMIN', 'MANAGER', 'COMPTABLE'),
 *   createFacture
 * );
 * 
 * @example
 * // Rôles disponibles dans le système
 * // - ADMIN : Accès complet
 * // - MANAGER : Gestion des opérations
 * // - COMPTABLE : Facturation et paie
 * // - EMPLOYE : Consultation limitée
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Vérification de la présence des infos utilisateur
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Permissions insuffisantes.'
      });
    }
    next();
  };
};
