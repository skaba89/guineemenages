# GuinéaManager - ERP pour PME Guinéennes

![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)

## 📋 Description

**GuinéaManager** est un ERP (Enterprise Resource Planning) moderne et complet, spécialement conçu pour les PME guinéennes. Il intègre les particularités fiscales et sociales de la Guinée, notamment les calculs de CNSS et d'IPR conformes à la législation locale.

### 🇬🇳 Spécificités Guinéennes

- **CNSS Employé** : 5% (plafonné à 5 000 000 GNF)
- **CNSS Employeur** : 18% (plafonné à 5 000 000 GNF)
- **IPR (Impôt sur le Revenu)** : Barème progressif guinéen
  - 0 - 3 000 000 GNF : 0%
  - 3 000 001 - 5 000 000 GNF : 10%
  - 5 000 001 - 10 000 000 GNF : 15%
  - Plus de 10 000 000 GNF : 20%
- **Devise** : Franc Guinéen (GNF)
- **Mobile Money** : Orange Money, MTN Money

---

## ✨ Fonctionnalités

### 📊 Modules Principaux

| Module | Description | Statut |
|--------|-------------|--------|
| 🔐 **Authentification** | Inscription, connexion, rôles | ✅ Complet |
| 👥 **Clients** | Gestion des clients (particuliers/entreprises) | ✅ Complet |
| 📦 **Produits** | Catalogue et gestion des stocks | ✅ Complet |
| 📄 **Factures** | Facturation avec génération PDF | ✅ Complet |
| 👨‍💼 **Employés** | Gestion du personnel | ✅ Complet |
| 💰 **Paie** | Bulletins de paie avec calculs CNSS/IPR | ✅ Complet |
| 💸 **Dépenses** | Suivi des dépenses | ✅ Complet |
| 📈 **Dashboard** | Tableau de bord et statistiques | ✅ Complet |
| 📑 **Rapports** | Analyses et exports | ⚠️ Partiel |

### 🎯 Fonctionnalités Clés

- ✅ **Multi-entreprises** : Chaque compte crée son espace entreprise
- ✅ **Rôles utilisateur** : Admin, Manager, Comptable, Employé
- ✅ **Factures PDF** : Génération automatique de factures professionnelles
- ✅ **Calculs automatiques** : TVA 18%, CNSS, IPR
- ✅ **Alertes** : Stock bas, factures en retard
- ✅ **Recherche** : Filtres et recherche sur tous les modules

---

## 🚀 Installation

### Prérequis

- Node.js >= 18
- npm ou yarn ou bun
- Git

### 1. Cloner le projet

```bash
git clone https://github.com/skaba89/guineemenages.git
cd guineemenages
```

### 2. Installer le Frontend

```bash
# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local
```

### 3. Installer le Backend

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Initialiser la base de données
npx prisma db push

# Retourner à la racine
cd ..
```

### 4. Configuration des variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Backend (dans backend/.env)
DATABASE_URL="file:./dev.db"
JWT_SECRET="votre-secret-jwt-tres-securise"
JWT_EXPIRES_IN="7d"
```

### 5. Lancer l'application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001

---

## 🔧 Configuration

### Structure des dossiers

```
guineemenages/
├── src/                    # Frontend Next.js
│   ├── app/               # Pages (App Router)
│   ├── components/        # Composants React
│   │   ├── layout/       # Sidebar, Header
│   │   ├── pages/        # Pages métier
│   │   └── ui/           # Composants shadcn/ui
│   ├── lib/              # Utilitaires, API client
│   ├── stores/           # État global (Zustand)
│   └── types/            # Types TypeScript
│
├── backend/               # Backend Express
│   ├── src/
│   │   ├── routes/       # Routes API
│   │   ├── services/     # Logique métier
│   │   ├── middlewares/  # Auth, erreurs
│   │   └── utils/        # Utilitaires
│   ├── prisma/           # Schéma DB
│   └── tests/            # Tests unitaires
│
└── download/             # Fichiers générés
```

### Base de données

Le projet utilise **SQLite** en développement et **PostgreSQL** en production. Le schéma Prisma définit les modèles suivants :

- `User` - Utilisateurs
- `Company` - Entreprises
- `Client` - Clients
- `Produit` - Produits/Services
- `Facture` + `LigneFacture` - Facturation
- `Employe` - Employés
- `BulletinPaie` - Bulletins de paie
- `Depense` - Dépenses

---

## 📖 API Documentation

### Authentification

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Ressources

| Endpoint | Méthodes | Description |
|----------|----------|-------------|
| `/api/clients` | GET, POST, PUT, DELETE | Gestion clients |
| `/api/produits` | GET, POST, PUT, DELETE | Gestion produits |
| `/api/factures` | GET, POST, PUT, DELETE | Gestion factures |
| `/api/factures/:id/pdf` | GET | Télécharger PDF |
| `/api/employes` | GET, POST, PUT, DELETE | Gestion employés |
| `/api/paie/bulletins` | GET, POST | Bulletins de paie |
| `/api/paie/calculer` | POST | Calculer paie |
| `/api/depenses` | GET, POST, PUT, DELETE | Gestion dépenses |
| `/api/dashboard/stats` | GET | Statistiques |

### Exemple de requête

```bash
# Connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@guineamanager.com", "password": "password123"}'

# Créer un client (avec token)
curl -X POST http://localhost:3001/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom": "Client Test", "email": "client@test.com"}'
```

---

## 🧪 Tests

```bash
# Lancer les tests backend
cd backend
npm run test

# Tests avec couverture
npm run test:coverage
```

### Tests disponibles

- **Payroll** : Calculs CNSS, IPR, net à payer (10 tests)
- **Auth** : Inscription, connexion, JWT (8 tests)
- **Clients** : CRUD, validation (10 tests)
- **Factures** : Calculs TVA, création (10 tests)

---

## 🛠️ Technologies

### Frontend
- **Next.js 16** - Framework React
- **React 19** - UI Library
- **TypeScript** - Typage statique
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Composants UI
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **Recharts** - Graphiques

### Backend
- **Express 4** - Framework Node.js
- **Prisma** - ORM
- **SQLite/PostgreSQL** - Base de données
- **JWT** - Authentification
- **Zod** - Validation
- **pdfkit** - Génération PDF

---

## 📱 Captures d'écran

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Facture PDF
![Invoice](docs/screenshots/invoice-pdf.png)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

### Standards de code

- TypeScript strict
- ESLint + Prettier
- Tests unitaires pour les nouvelles fonctionnalités
- Documentation JSDoc

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Auteurs

- **GuinéaManager Team** - *Développement initial*

---

## 🆘 Support

- **Documentation** : [docs.guineamanager.com](https://docs.guineamanager.com)
- **Issues** : [GitHub Issues](https://github.com/skaba89/guineemenages/issues)
- **Email** : support@guineamanager.com

---

## 🗓️ Feuille de route

### Version 1.1 (Q2 2025)
- [ ] Export Excel
- [ ] Envoi d'emails
- [ ] Notifications push
- [ ] Application mobile

### Version 1.2 (Q3 2025)
- [ ] Multi-devises
- [ ] API Orange Money
- [ ] SMS OTP
- [ ] Intégrations comptables

### Version 2.0 (Q4 2025)
- [ ] Multi-sociétés
- [ ] Tableau de bord avancé
- [ ] IA pour prévisions
