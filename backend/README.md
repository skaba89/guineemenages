# GuinéaManager Backend - API REST

Backend Express.js pour l'ERP GuinéaManager avec Prisma ORM.

## 🚀 Démarrage rapide

```bash
# Installation
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos variables

# Base de données
npx prisma generate
npx prisma db push

# Développement
npm run dev
```

## 📁 Structure

```
src/
├── index.ts              # Point d'entrée
├── routes/               # Routes API
│   ├── auth.routes.ts   # Authentification
│   ├── clients.routes.ts
│   ├── produits.routes.ts
│   ├── factures.routes.ts
│   ├── employes.routes.ts
│   ├── paie.routes.ts
│   ├── depenses.routes.ts
│   └── dashboard.routes.ts
├── services/             # Logique métier
├── middlewares/          # Middlewares
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── utils/                # Utilitaires
│   ├── payroll.ts       # Calculs paie Guinée
│   ├── pdf-generator.ts # Génération factures PDF
│   ├── jwt.ts           # Utilitaires JWT
│   └── validation.ts    # Schémas Zod
└── types/                # Types TypeScript
```

## ⚙️ Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | 3001 |
| `DATABASE_URL` | URL de connexion DB | file:./dev.db |
| `JWT_SECRET` | Secret JWT | (requis) |
| `JWT_EXPIRES_IN` | Durée validité token | 7d |
| `NODE_ENV` | Environnement | development |

## 📡 API Endpoints

### Authentification

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

**Exemple inscription :**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nom": "Diallo",
  "prenom": "Mamadou",
  "companyName": "Mon Entreprise SARL"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "cuid",
      "email": "user@example.com",
      "nom": "Diallo",
      "prenom": "Mamadou",
      "role": "ADMIN",
      "company": { "id": "...", "nom": "Mon Entreprise SARL" }
    }
  }
}
```

### Clients

```http
GET    /api/clients          # Liste des clients
GET    /api/clients/:id      # Détail client
POST   /api/clients          # Créer client
PUT    /api/clients/:id      # Modifier client
DELETE /api/clients/:id      # Supprimer client
```

### Produits

```http
GET    /api/produits         # Liste des produits
GET    /api/produits/:id     # Détail produit
POST   /api/produits         # Créer produit
PUT    /api/produits/:id     # Modifier produit
DELETE /api/produits/:id     # Supprimer produit
```

### Factures

```http
GET    /api/factures         # Liste des factures
GET    /api/factures/:id     # Détail facture
GET    /api/factures/:id/pdf # Télécharger PDF
POST   /api/factures         # Créer facture
PUT    /api/factures/:id/statut  # Modifier statut
DELETE /api/factures/:id     # Supprimer facture
```

### Employés

```http
GET    /api/employes         # Liste des employés
GET    /api/employes/:id     # Détail employé
POST   /api/employes         # Créer employé
PUT    /api/employes/:id     # Modifier employé
DELETE /api/employes/:id     # Supprimer employé
```

### Paie

```http
GET  /api/paie/bulletins     # Liste des bulletins
POST /api/paie/bulletins     # Créer bulletin
PUT  /api/paie/bulletins/:id/valider  # Valider
PUT  /api/paie/bulletins/:id/payer    # Marquer payé
POST /api/paie/calculer      # Calculer paie
GET  /api/paie/masse-salariale  # Masse salariale
```

### Dépenses

```http
GET    /api/depenses         # Liste des dépenses
GET    /api/depenses/:id     # Détail dépense
POST   /api/depenses         # Créer dépense
PUT    /api/depenses/:id     # Modifier dépense
DELETE /api/depenses/:id     # Supprimer dépense
```

### Dashboard

```http
GET /api/dashboard/stats     # Statistiques
GET /api/dashboard/alertes   # Alertes
```

## 🇬🇳 Calculs de Paie Guinéens

### CNSS

```typescript
// Employé : 5% du brut (plafonné à 5M GNF)
cnssEmploye = Math.min(brutTotal, 5_000_000) * 0.05;

// Employeur : 18% du brut (plafonné à 5M GNF)
cnssEmployeur = Math.min(brutTotal, 5_000_000) * 0.18;
```

### IPR (Barème progressif)

| Tranche | Taux |
|---------|------|
| 0 - 3 000 000 GNF | 0% |
| 3 000 001 - 5 000 000 GNF | 10% |
| 5 000 001 - 10 000 000 GNF | 15% |
| Plus de 10 000 000 GNF | 20% |

## 🧪 Tests

```bash
# Lancer les tests
npm run test

# Tests avec watch mode
npm run test:watch

# Couverture
npm run test:coverage
```

## 📦 Dépendances principales

| Package | Version | Usage |
|---------|---------|-------|
| express | 4.18.2 | Framework web |
| prisma | 5.10.0 | ORM |
| zod | 3.22.4 | Validation |
| jsonwebtoken | 9.0.2 | Auth JWT |
| bcryptjs | 2.4.3 | Hash passwords |
| pdfkit | 0.18.0 | Génération PDF |

## 🔒 Sécurité

- **Helmet** : Headers HTTP sécurisés
- **CORS** : Configuration stricte des origines
- **JWT** : Authentification stateless
- **Bcrypt** : Hashage des mots de passe (salt rounds: 10)
- **Validation** : Schémas Zod sur toutes les entrées

## 🚢 Déploiement

### Production

```bash
# Build
npm run build

# Migration DB
npx prisma migrate deploy

# Start
npm start
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```
