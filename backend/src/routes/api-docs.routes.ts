/**
 * API Documentation for GuinéaManager ERP
 * 
 * This file documents all public API endpoints for integration purposes.
 * For interactive documentation, visit /api/docs when running the server.
 */

import { Router, Request, Response } from 'express';

const router = Router();

// API Documentation endpoint
router.get('/docs', (req: Request, res: Response) => {
  res.json({
    name: 'GuinéaManager ERP API',
    version: '1.0.0',
    description: 'API REST pour la gestion ERP des PME en Afrique de l\'Ouest',
    baseUrl: '/api',
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      description: 'Obtenez un token via /api/auth/login'
    },
    endpoints: {
      auth: {
        'POST /auth/login': {
          description: 'Connexion utilisateur',
          body: { email: 'string', password: 'string' },
          response: { token: 'string', user: 'object' }
        },
        'POST /auth/register': {
          description: 'Inscription avec création d\'entreprise',
          body: { email: 'string', password: 'string', nom: 'string', prenom: 'string', companyName: 'string' },
          response: { token: 'string', user: 'object' }
        },
        'POST /auth/forgot-password': {
          description: 'Demander réinitialisation mot de passe',
          body: { email: 'string' }
        },
        'POST /auth/reset-password': {
          description: 'Réinitialiser mot de passe',
          body: { token: 'string', password: 'string' }
        },
        'GET /auth/me': {
          description: 'Obtenir profil utilisateur connecté',
          auth: true
        },
        'POST /auth/2fa/setup/initiate': {
          description: 'Initier configuration 2FA',
          body: { method: 'totp | sms' },
          auth: true
        },
        'POST /auth/2fa/setup/verify': {
          description: 'Vérifier et activer 2FA',
          body: { code: 'string (6 digits)' },
          auth: true
        }
      },
      clients: {
        'GET /clients': {
          description: 'Lister les clients',
          auth: true,
          query: { search: 'string', page: 'number', limit: 'number' }
        },
        'POST /clients': {
          description: 'Créer un client',
          auth: true,
          body: {
            nom: 'string',
            email: 'string?',
            telephone: 'string?',
            type: 'PARTICULIER | ENTREPRISE',
            adresse: 'string?',
            ville: 'string?'
          }
        },
        'PUT /clients/:id': {
          description: 'Modifier un client',
          auth: true,
          body: 'Partial client object'
        },
        'DELETE /clients/:id': {
          description: 'Supprimer un client',
          auth: true
        }
      },
      produits: {
        'GET /produits': {
          description: 'Lister les produits/services',
          auth: true,
          query: { search: 'string', categorie: 'string', page: 'number', limit: 'number' }
        },
        'POST /produits': {
          description: 'Créer un produit',
          auth: true,
          body: {
            nom: 'string',
            description: 'string?',
            prixUnitaire: 'number',
            unite: 'string',
            type: 'PRODUIT | SERVICE',
            stockActuel: 'number?',
            stockMin: 'number?',
            categorie: 'string?'
          }
        },
        'PUT /produits/:id': {
          description: 'Modifier un produit',
          auth: true
        },
        'DELETE /produits/:id': {
          description: 'Supprimer un produit',
          auth: true
        }
      },
      factures: {
        'GET /factures': {
          description: 'Lister les factures',
          auth: true,
          query: { statut: 'string', clientId: 'string', page: 'number', limit: 'number' }
        },
        'POST /factures': {
          description: 'Créer une facture',
          auth: true,
          body: {
            clientId: 'string',
            dateEcheance: 'date',
            lignes: [{
              produitId: 'string?',
              description: 'string',
              quantite: 'number',
              prixUnitaire: 'number',
              tauxTVA: 'number?'
            }],
            notes: 'string?'
          }
        },
        'PUT /factures/:id/statut': {
          description: 'Modifier statut facture',
          auth: true,
          body: { statut: 'BROUILLON | ENVOYEE | PAYEE | EN_RETARD | ANNULEE' }
        },
        'GET /factures/:id/pdf': {
          description: 'Télécharger PDF facture',
          auth: true,
          response: 'application/pdf'
        }
      },
      employes: {
        'GET /employes': {
          description: 'Lister les employés',
          auth: true,
          query: { departement: 'string', search: 'string' }
        },
        'POST /employes': {
          description: 'Créer un employé',
          auth: true,
          body: {
            matricule: 'string',
            nom: 'string',
            prenom: 'string',
            email: 'string?',
            telephone: 'string?',
            poste: 'string',
            departement: 'string?',
            salaireBase: 'number',
            dateEmbauche: 'date',
            typeContrat: 'CDI | CDD | APPRENTISSAGE | STAGE'
          }
        },
        'PUT /employes/:id': {
          description: 'Modifier un employé',
          auth: true
        },
        'DELETE /employes/:id': {
          description: 'Supprimer un employé',
          auth: true
        }
      },
      paie: {
        'POST /paie/calculer': {
          description: 'Calculer la paie pour un employé',
          auth: true,
          body: {
            employeId: 'string',
            mois: 'number (1-12)',
            annee: 'number',
            heuresSupplementaires: 'number?',
            primes: 'number?',
            indemnites: 'number?'
          }
        },
        'GET /paie/bulletins': {
          description: 'Lister les bulletins de paie',
          auth: true,
          query: { mois: 'number', annee: 'number', employeId: 'string' }
        },
        'PUT /paie/bulletins/:id/valider': {
          description: 'Valider un bulletin',
          auth: true
        },
        'PUT /paie/bulletins/:id/payer': {
          description: 'Marquer comme payé',
          auth: true,
          body: { modePaiement: 'string', reference: 'string?' }
        }
      },
      devis: {
        'GET /devis': {
          description: 'Lister les devis',
          auth: true,
          query: { statut: 'string', clientId: 'string', page: 'number', limit: 'number' }
        },
        'POST /devis': {
          description: 'Créer un devis',
          auth: true,
          body: {
            clientId: 'string',
            dateValidite: 'date',
            lignes: [{
              produitId: 'string?',
              description: 'string',
              quantite: 'number',
              prixUnitaire: 'number',
              tauxTVA: 'number?'
            }],
            conditions: 'string?',
            notes: 'string?'
          }
        },
        'PUT /devis/:id/status': {
          description: 'Modifier statut devis',
          auth: true,
          body: { statut: 'BROUILLON | ENVOYE | ACCEPTE | REFUSE | EXPIRE' }
        },
        'POST /devis/:id/convert': {
          description: 'Convertir devis en facture',
          auth: true
        }
      },
      stock: {
        'GET /stock/alerts': {
          description: 'Obtenir les alertes de stock',
          auth: true
        },
        'GET /stock/low-stock': {
          description: 'Produits en stock bas',
          auth: true
        },
        'POST /stock/movement': {
          description: 'Enregistrer mouvement de stock',
          auth: true,
          body: {
            produitId: 'string',
            type: 'ENTREE | SORTIE | AJUSTEMENT | TRANSFERT',
            quantite: 'number',
            raison: 'string?'
          }
        },
        'GET /stock/valuation': {
          description: 'Valorisation du stock',
          auth: true,
          query: { method: 'FIFO | LIFO | AVERAGE' }
        }
      },
      notifications: {
        'GET /notifications': {
          description: 'Lister les notifications',
          auth: true,
          query: { lu: 'boolean', type: 'string' }
        },
        'PUT /notifications/read-all': {
          description: 'Marquer toutes comme lues',
          auth: true
        },
        'POST /notifications/subscribe': {
          description: 'S\'abonner aux push notifications',
          auth: true,
          body: {
            endpoint: 'string',
            keys: { p256dh: 'string', auth: 'string' }
          }
        }
      },
      paiementsMobile: {
        'POST /paiements-mobile/orange-money/initiate': {
          description: 'Initier paiement Orange Money',
          auth: true,
          body: {
            amount: 'number',
            orderId: 'string',
            customerPhone: 'string',
            description: 'string?'
          }
        },
        'GET /paiements-mobile/status/:id': {
          description: 'Vérifier statut paiement',
          auth: true
        }
      },
      dashboard: {
        'GET /dashboard/stats': {
          description: 'Statistiques du tableau de bord',
          auth: true
        },
        'GET /dashboard/alertes': {
          description: 'Alertes (stock bas, factures en retard)',
          auth: true
        }
      }
    },
    pagination: {
      description: 'Les endpoints de liste supportent la pagination',
      parameters: {
        page: 'Numéro de page (défaut: 1)',
        limit: 'Éléments par page (défaut: 20, max: 100)'
      },
      response: {
        pagination: {
          total: 'Nombre total d\'éléments',
          page: 'Page actuelle',
          limit: 'Éléments par page',
          totalPages: 'Nombre total de pages'
        }
      }
    },
    errorCodes: {
      400: 'Requête invalide - Vérifiez les paramètres',
      401: 'Non authentifié - Token manquant ou invalide',
      403: 'Accès refusé - Permissions insuffisantes',
      404: 'Ressource non trouvée',
      422: 'Données invalides - Erreur de validation',
      429: 'Trop de requêtes - Rate limit atteint',
      500: 'Erreur serveur'
    },
    rateLimits: {
      general: '10 requêtes/seconde',
      api: '30 requêtes/seconde',
      auth: '5 requêtes/seconde'
    },
    webhooks: {
      description: 'Webhooks disponibles pour les intégrations',
      events: [
        'invoice.created',
        'invoice.paid',
        'invoice.overdue',
        'quote.accepted',
        'payment.received',
        'stock.low',
        'payroll.ready'
      ],
      format: {
        method: 'POST',
        headers: {
          'X-GuineaManager-Signature': 'SHA256 signature',
          'Content-Type': 'application/json'
        }
      }
    }
  });
});

// OpenAPI 3.0 specification
router.get('/openapi.json', (req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'GuinéaManager ERP API',
      version: '1.0.0',
      description: 'API REST pour la gestion ERP des PME en Afrique de l\'Ouest',
      contact: {
        name: 'Support GuinéaManager',
        email: 'support@guineamanager.com',
        url: 'https://guineamanager.com'
      }
    },
    servers: [
      { url: '/api', description: 'Serveur actuel' },
      { url: 'https://api.guineamanager.com', description: 'Production' }
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Client: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nom: { type: 'string' },
            email: { type: 'string', format: 'email' },
            telephone: { type: 'string' },
            type: { type: 'string', enum: ['PARTICULIER', 'ENTREPRISE'] },
            adresse: { type: 'string' },
            ville: { type: 'string' },
            pays: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Produit: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nom: { type: 'string' },
            description: { type: 'string' },
            prixUnitaire: { type: 'number' },
            unite: { type: 'string' },
            type: { type: 'string', enum: ['PRODUIT', 'SERVICE'] },
            stockActuel: { type: 'number' },
            stockMin: { type: 'number' },
            categorie: { type: 'string' }
          }
        },
        Facture: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            numero: { type: 'string' },
            clientId: { type: 'string' },
            dateEmission: { type: 'string', format: 'date' },
            dateEcheance: { type: 'string', format: 'date' },
            montantHT: { type: 'number' },
            montantTVA: { type: 'number' },
            montantTTC: { type: 'number' },
            statut: { type: 'string', enum: ['BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE'] }
          }
        },
        Employe: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            matricule: { type: 'string' },
            nom: { type: 'string' },
            prenom: { type: 'string' },
            email: { type: 'string', format: 'email' },
            poste: { type: 'string' },
            departement: { type: 'string' },
            salaireBase: { type: 'number' },
            typeContrat: { type: 'string' },
            dateEmbauche: { type: 'string', format: 'date' }
          }
        },
        BulletinPaie: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            employeId: { type: 'string' },
            mois: { type: 'number' },
            annee: { type: 'number' },
            salaireBase: { type: 'number' },
            brutTotal: { type: 'number' },
            cnssEmploye: { type: 'number' },
            ipr: { type: 'number' },
            netAPayer: { type: 'number' },
            statut: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    },
    paths: {
      '/auth/login': {
        post: {
          summary: 'Connexion utilisateur',
          tags: ['Authentification'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Connexion réussie',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          token: { type: 'string' },
                          user: { $ref: '#/components/schemas/Employe' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Identifiants invalides' }
          }
        }
      }
    }
  });
});

export default router;
