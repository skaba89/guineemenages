/**
 * Swagger/OpenAPI Configuration for GuinéaManager ERP
 * 
 * This configuration sets up the OpenAPI 3.0 specification with:
 * - API info and metadata
 * - Server configurations for development and production
 * - Authentication schemes (Bearer JWT)
 * - Multi-tenant headers (companyId)
 */

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';

// Load YAML documentation files
const docsPath = path.join(__dirname, '../docs');

// Helper to read YAML files
function loadYamlFile(filename: string): object {
  const filePath = path.join(docsPath, filename);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Parse YAML manually (simple parser for our use case)
    return parseSimpleYaml(content);
  }
  return {};
}

// Simple YAML parser for our documentation files
function parseSimpleYaml(content: string): object {
  // For complex YAML, we use JSON format in .json files instead
  return {};
}

// Options for swagger-jsdoc
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'GuinéaManager ERP API',
      version: '1.0.0',
      description: `
# GuinéaManager ERP API

API REST complète pour la gestion ERP des PME en Afrique de l'Ouest.

## Fonctionnalités

- **Authentification** : Inscription, connexion, 2FA, récupération de mot de passe
- **Facturation** : Création, envoi, suivi des factures avec génération PDF
- **Clients** : Gestion complète de la relation client (CRM)
- **Produits** : Catalogue produits et services avec gestion des stocks
- **Paie** : Calculs conformes à la législation guinéenne (CNSS, IPR)
- **Devis & Commandes** : Gestion du cycle de vente complet
- **Stock** : Multi-entrepôts, transferts, inventaires

## Authentification

Toutes les requêtes authentifiées nécessitent un token JWT dans l'en-tête :
\`\`\`
Authorization: Bearer <votre_token>
\`\`\`

## Multi-tenant

L'API supporte le multi-tenant via l'en-tête \`companyId\` :
\`\`\`
companyId: <votre_company_id>
\`\`\`

## Rate Limiting

- Requêtes générales : 10/seconde
- API authentifiée : 30/seconde
- Authentification : 5/seconde

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 422 | Données invalides |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |
      `,
      termsOfService: 'https://guineamanager.com/terms',
      contact: {
        name: 'Support GuinéaManager',
        email: 'support@guineamanager.com',
        url: 'https://guineamanager.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Serveur de développement',
      },
      {
        url: 'https://api.guineamanager.com/api',
        description: 'Serveur de production',
      },
      {
        url: 'https://staging-api.guineamanager.com/api',
        description: 'Serveur de staging',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /auth/login',
        },
        companyId: {
          type: 'apiKey',
          in: 'header',
          name: 'companyId',
          description: 'Identifiant de l\'entreprise (multi-tenant)',
        },
      },
      parameters: {
        pageParam: {
          name: 'page',
          in: 'query',
          description: 'Numéro de page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        limitParam: {
          name: 'limit',
          in: 'query',
          description: 'Éléments par page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        searchParam: {
          name: 'search',
          in: 'query',
          description: 'Recherche textuelle',
          required: false,
          schema: {
            type: 'string',
          },
        },
      },
      responses: {
        unauthorized: {
          description: 'Non authentifié',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Token manquant ou invalide',
              },
            },
          },
        },
        forbidden: {
          description: 'Accès refusé',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Permissions insuffisantes',
              },
            },
          },
        },
        notFound: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Ressource non trouvée',
              },
            },
          },
        },
        validationError: {
          description: 'Erreur de validation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Données invalides',
                errors: [
                  { field: 'email', message: 'Email invalide' },
                ],
              },
            },
          },
        },
        rateLimited: {
          description: 'Trop de requêtes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Trop de requêtes. Veuillez réessayer plus tard.',
              },
            },
          },
        },
      },
      schemas: {
        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Mot de passe',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'nom', 'prenom', 'companyName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Mot de passe',
            },
            nom: {
              type: 'string',
              description: 'Nom de famille',
            },
            prenom: {
              type: 'string',
              description: 'Prénom',
            },
            companyName: {
              type: 'string',
              description: 'Nom de l\'entreprise',
            },
            pays: {
              type: 'string',
              enum: ['GUINEE', 'SENEGAL', 'MALI', 'COTE_D_IVOIRE', 'BURKINA_FASO', 'BENIN', 'TOGO', 'NIGER'],
              description: 'Pays d\'origine',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Token JWT',
                },
                refreshToken: {
                  type: 'string',
                  description: 'Token de rafraîchissement',
                },
                user: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant unique',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            nom: {
              type: 'string',
            },
            prenom: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'COMPTABLE', 'EMPLOYE'],
            },
            company: {
              $ref: '#/components/schemas/Company',
            },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            nom: {
              type: 'string',
            },
            pays: {
              type: 'string',
            },
            devise: {
              type: 'string',
            },
          },
        },

        // Client schemas
        Client: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            nom: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            telephone: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['PARTICULIER', 'ENTREPRISE'],
            },
            adresse: {
              type: 'string',
            },
            ville: {
              type: 'string',
            },
            pays: {
              type: 'string',
            },
            notes: {
              type: 'string',
            },
            totalAchats: {
              type: 'number',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ClientInput: {
          type: 'object',
          required: ['nom'],
          properties: {
            nom: {
              type: 'string',
              description: 'Nom du client',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            telephone: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['PARTICULIER', 'ENTREPRISE'],
              default: 'PARTICULIER',
            },
            adresse: {
              type: 'string',
            },
            ville: {
              type: 'string',
            },
            pays: {
              type: 'string',
            },
            notes: {
              type: 'string',
            },
          },
        },

        // Product schemas
        Produit: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            nom: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            prixUnitaire: {
              type: 'number',
            },
            unite: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['PRODUIT', 'SERVICE'],
            },
            stockActuel: {
              type: 'number',
            },
            stockMin: {
              type: 'number',
            },
            categorie: {
              type: 'string',
            },
            actif: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ProduitInput: {
          type: 'object',
          required: ['nom', 'prixUnitaire', 'unite'],
          properties: {
            nom: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            prixUnitaire: {
              type: 'number',
              minimum: 0,
            },
            unite: {
              type: 'string',
              description: 'Unité de mesure (kg, pièce, m², etc.)',
            },
            type: {
              type: 'string',
              enum: ['PRODUIT', 'SERVICE'],
              default: 'PRODUIT',
            },
            stockActuel: {
              type: 'number',
            },
            stockMin: {
              type: 'number',
            },
            categorie: {
              type: 'string',
            },
          },
        },

        // Invoice schemas
        Facture: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            numero: {
              type: 'string',
            },
            clientId: {
              type: 'string',
            },
            client: {
              $ref: '#/components/schemas/Client',
            },
            dateEmission: {
              type: 'string',
              format: 'date',
            },
            dateEcheance: {
              type: 'string',
              format: 'date',
            },
            lignes: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/LigneFacture',
              },
            },
            montantHT: {
              type: 'number',
            },
            montantTVA: {
              type: 'number',
            },
            montantTTC: {
              type: 'number',
            },
            statut: {
              type: 'string',
              enum: ['BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE'],
            },
            notes: {
              type: 'string',
            },
            pdfUrl: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        LigneFacture: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            produitId: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            quantite: {
              type: 'number',
            },
            prixUnitaire: {
              type: 'number',
            },
            tauxTVA: {
              type: 'number',
            },
            montantHT: {
              type: 'number',
            },
            montantTVA: {
              type: 'number',
            },
          },
        },
        FactureInput: {
          type: 'object',
          required: ['clientId', 'lignes'],
          properties: {
            clientId: {
              type: 'string',
            },
            dateEcheance: {
              type: 'string',
              format: 'date',
            },
            lignes: {
              type: 'array',
              items: {
                type: 'object',
                required: ['description', 'quantite', 'prixUnitaire'],
                properties: {
                  produitId: {
                    type: 'string',
                  },
                  description: {
                    type: 'string',
                  },
                  quantite: {
                    type: 'number',
                    minimum: 0,
                  },
                  prixUnitaire: {
                    type: 'number',
                    minimum: 0,
                  },
                  tauxTVA: {
                    type: 'number',
                    default: 0,
                  },
                },
              },
            },
            notes: {
              type: 'string',
            },
          },
        },

        // Employee schemas
        Employe: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            matricule: {
              type: 'string',
            },
            nom: {
              type: 'string',
            },
            prenom: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            telephone: {
              type: 'string',
            },
            poste: {
              type: 'string',
            },
            departement: {
              type: 'string',
            },
            salaireBase: {
              type: 'number',
            },
            dateEmbauche: {
              type: 'string',
              format: 'date',
            },
            typeContrat: {
              type: 'string',
              enum: ['CDI', 'CDD', 'APPRENTISSAGE', 'STAGE'],
            },
            actif: {
              type: 'boolean',
            },
          },
        },
        EmployeInput: {
          type: 'object',
          required: ['matricule', 'nom', 'prenom', 'poste', 'salaireBase', 'dateEmbauche', 'typeContrat'],
          properties: {
            matricule: {
              type: 'string',
            },
            nom: {
              type: 'string',
            },
            prenom: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            telephone: {
              type: 'string',
            },
            poste: {
              type: 'string',
            },
            departement: {
              type: 'string',
            },
            salaireBase: {
              type: 'number',
              minimum: 0,
            },
            dateEmbauche: {
              type: 'string',
              format: 'date',
            },
            typeContrat: {
              type: 'string',
              enum: ['CDI', 'CDD', 'APPRENTISSAGE', 'STAGE'],
            },
          },
        },

        // Payslip schemas
        BulletinPaie: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            employeId: {
              type: 'string',
            },
            employe: {
              $ref: '#/components/schemas/Employe',
            },
            mois: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
            },
            annee: {
              type: 'integer',
            },
            salaireBase: {
              type: 'number',
            },
            heuresSupplementaires: {
              type: 'number',
            },
            montantHeuresSup: {
              type: 'number',
            },
            primes: {
              type: 'number',
            },
            indemnites: {
              type: 'number',
            },
            brutTotal: {
              type: 'number',
            },
            cnssEmploye: {
              type: 'number',
              description: 'CNSS employé (5% en Guinée)',
            },
            cnssEmployeur: {
              type: 'number',
              description: 'CNSS employeur (18% en Guinée)',
            },
            ipr: {
              type: 'number',
              description: 'IPR (barème progressif)',
            },
            autresRetenues: {
              type: 'number',
            },
            netAPayer: {
              type: 'number',
            },
            statut: {
              type: 'string',
              enum: ['BROUILLON', 'VALIDE', 'PAYE'],
            },
          },
        },
        CalculPaieInput: {
          type: 'object',
          required: ['employeId', 'mois', 'annee'],
          properties: {
            employeId: {
              type: 'string',
            },
            mois: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
            },
            annee: {
              type: 'integer',
            },
            heuresSupplementaires: {
              type: 'number',
            },
            primes: {
              type: 'number',
            },
            indemnites: {
              type: 'number',
            },
            autresRetenues: {
              type: 'number',
            },
          },
        },

        // Quote schemas
        Devis: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            numero: {
              type: 'string',
            },
            clientId: {
              type: 'string',
            },
            client: {
              $ref: '#/components/schemas/Client',
            },
            dateEmission: {
              type: 'string',
              format: 'date',
            },
            dateValidite: {
              type: 'string',
              format: 'date',
            },
            lignes: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/LigneFacture',
              },
            },
            montantHT: {
              type: 'number',
            },
            montantTVA: {
              type: 'number',
            },
            montantTTC: {
              type: 'number',
            },
            statut: {
              type: 'string',
              enum: ['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE'],
            },
            conditions: {
              type: 'string',
            },
            notes: {
              type: 'string',
            },
          },
        },
        DevisInput: {
          type: 'object',
          required: ['clientId', 'lignes'],
          properties: {
            clientId: {
              type: 'string',
            },
            dateValidite: {
              type: 'string',
              format: 'date',
            },
            lignes: {
              type: 'array',
              items: {
                type: 'object',
                required: ['description', 'quantite', 'prixUnitaire'],
                properties: {
                  produitId: {
                    type: 'string',
                  },
                  description: {
                    type: 'string',
                  },
                  quantite: {
                    type: 'number',
                    minimum: 0,
                  },
                  prixUnitaire: {
                    type: 'number',
                    minimum: 0,
                  },
                  tauxTVA: {
                    type: 'number',
                    default: 0,
                  },
                },
              },
            },
            conditions: {
              type: 'string',
            },
            notes: {
              type: 'string',
            },
          },
        },

        // Stock schemas
        Entrepot: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            nom: {
              type: 'string',
            },
            adresse: {
              type: 'string',
            },
            ville: {
              type: 'string',
            },
            responsable: {
              type: 'string',
            },
            actif: {
              type: 'boolean',
            },
          },
        },
        MouvementStock: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            produitId: {
              type: 'string',
            },
            entrepotId: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['ENTREE', 'SORTIE', 'AJUSTEMENT', 'TRANSFERT'],
            },
            quantite: {
              type: 'number',
            },
            raison: {
              type: 'string',
            },
            reference: {
              type: 'string',
            },
            date: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        StockAlert: {
          type: 'object',
          properties: {
            produitId: {
              type: 'string',
            },
            produitNom: {
              type: 'string',
            },
            stockActuel: {
              type: 'number',
            },
            stockMin: {
              type: 'number',
            },
            ecart: {
              type: 'number',
            },
            entrepotId: {
              type: 'string',
            },
          },
        },

        // Common schemas
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
            },
            page: {
              type: 'integer',
            },
            limit: {
              type: 'integer',
            },
            totalPages: {
              type: 'integer',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentification',
        description: 'Gestion de l\'authentification et des sessions',
      },
      {
        name: 'Clients',
        description: 'Gestion des clients et prospects',
      },
      {
        name: 'Produits',
        description: 'Gestion du catalogue produits et services',
      },
      {
        name: 'Factures',
        description: 'Gestion des factures et paiements',
      },
      {
        name: 'Devis',
        description: 'Gestion des devis et conversions',
      },
      {
        name: 'Employés',
        description: 'Gestion des employés et contrats',
      },
      {
        name: 'Paie',
        description: 'Gestion de la paie et bulletins',
      },
      {
        name: 'Stock',
        description: 'Gestion des stocks et entrepôts',
      },
      {
        name: 'Dashboard',
        description: 'Statistiques et alertes',
      },
    ],
  },
  // Path to API docs - using glob pattern to find all route files
  apis: [
    './src/routes/*.ts',
    './src/docs/*.yaml',
  ],
};

// Generate OpenAPI spec
export const swaggerSpec = swaggerJsdoc(options);

// Export for custom routes
export default swaggerSpec;
