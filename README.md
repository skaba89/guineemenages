# 🌍 GuinéaManager ERP

**ERP SaaS multi-pays pour les PME d'Afrique de l'Ouest**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/skaba89/guineemenages)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

---

## 📋 Vue d'ensemble

**GuinéaManager** est un ERP (Enterprise Resource Planning) SaaS complet, conçu spécifiquement pour les petites, moyennes et grandes entreprises d'Afrique de l'Ouest. Il prend en charge les particularités fiscales et sociales de chaque pays de la sous-région.

### 🎯 Objectifs

- **Simplicité**: Interface intuitive, adaptée aux réalités locales
- **Conformité**: Calculs fiscaux conformes à la législation de chaque pays
- **Évolutivité**: De la petite startup à la grande entreprise
- **Accessibilité**: Prix adaptés au marché africain

---

## 🌍 Pays Supportés

| Pays | Code | Devise | Organisme Social | Impôt sur le Revenu |
|------|------|--------|------------------|---------------------|
| 🇬🇳 Guinée | GN | GNF | CNSS (5%/18%) | IPR (0-20%) |
| 🇸🇳 Sénégal | SN | XOF | CSS/IPRES (5.6%/20.9%) | IR (0-40%) |
| 🇲🇱 Mali | ML | XOF | INPS (4%/17.6%) | IR (0-40%) |
| 🇨🇮 Côte d'Ivoire | CI | XOF | CNPS (6.3%/11.7%) | IR (0-40%) |
| 🇧🇫 Burkina Faso | BF | XOF | CNSS (5.5%/16.4%) | IR (0-40%) |
| 🇧🇯 Bénin | BJ | XOF | CNSS (3.6%/13.4%) | IR (0-35%) |
| 🇳🇪 Niger | NE | XOF | CNSS (4%/16.4%) | IR (0-40%) |

---

## 🚀 Fonctionnalités

### 📊 Tableau de Bord
- Vue d'ensemble en temps réel
- Indicateurs clés de performance (KPIs)
- Alertes automatiques (stocks bas, factures en retard)
- Graphiques interactifs

### 👥 Gestion des Clients
- Base de données clients complète
- Historique des achats
- Segmentation (Particulier/Entreprise)
- Export Excel

### 📦 Gestion des Produits
- Catalogue produits/services
- Gestion des stocks
- Alertes de réapprovisionnement
- Catégorisation

### 📄 Facturation
- Création de factures professionnelles
- Génération automatique PDF
- Suivi des paiements
- Multi-modes de paiement (Mobile Money inclus)
- Numérotation automatique

### 👔 Gestion des Employés
- Fiche employé complète
- Contrats (CDI, CDD, Stage, Apprentissage)
- Gestion des congés
- Historique de carrière

### 💰 Gestion de la Paie
- **Calcul automatique** selon le pays
- Cotisations sociales (CNSS/CSS/IPRES/CNPS/INPS)
- Impôts sur le revenu (IPR/IR) avec barème progressif
- Heures supplémentaires
- Primes et indemnités
- Bulletins de paie détaillés
- Rapports de cotisations
- Rapports fiscaux annuels

### 💸 Gestion des Dépenses
- Catégorisation des dépenses
- Suivi des paiements
- Justificatifs
- Rapports par catégorie

### 📈 Rapports & Analyses
- États financiers
- Graphiques de tendances
- Export Excel
- Rapports fiscaux (CNSS, IPR/IR)
- Analyse de rentabilité

### ⚙️ Paramètres
- Configuration société
- Paramètres fiscaux par pays
- Gestion des utilisateurs
- Préférences de notification

---

## 💳 Plans d'Abonnement

| Plan | Prix | Employés | Utilisateurs | Fonctionnalités |
|------|------|----------|--------------|-----------------|
| **PETITE** | Gratuit | 5 | 2 | Facturation, Clients, Produits |
| **MOYENNE** | 50 000 GNF/mois | 25 | 5 | Tout + Paie, Dépenses, Rapports |
| **GRANDE** | 150 000 GNF/mois | 100 | 15 | Tout + Multi-société, API |
| **ENTERPRISE** | Sur mesure | Illimité | Illimité | Tout + Support dédié |

---

## 🛠️ Stack Technique

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **State**: Zustand

### Backend
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Auth**: JWT
- **PDF**: pdfkit
- **Excel**: exceljs

---

## 📦 Installation

### Prérequis
- Node.js >= 18
- npm ou yarn
- Git

### Démarrage Rapide

#### Sur Linux/macOS

```bash
# Cloner le repository
git clone https://github.com/skaba89/guineemenages.git
cd guineemenages

# Installation des dépendances frontend
npm install

# Installation des dépendances backend et initialisation
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts

# Démarrage du backend (port 3001)
npx ts-node-dev --respawn --transpile-only src/index.ts

# Dans un autre terminal, démarrage du frontend (port 3000)
cd ..
npm run dev
```

#### Sur Windows (PowerShell)

```powershell
# Cloner le repository
git clone https://github.com/skaba89/guineemenages.git
cd guineemenages

# Installation des dépendances frontend
npm install

# Installation des dépendances backend
cd backend
npm install

# Initialisation de la base de données
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts

# Démarrage du backend (port 3001)
npx ts-node-dev --respawn --transpile-only src/index.ts

# Dans un autre terminal PowerShell, démarrage du frontend
cd ..
npm run dev
```

### 🔑 Identifiants de Démonstration

Une fois l'application démarrée, vous pouvez vous connecter avec :

- **Email**: `demo@guineamanager.com`
- **Mot de passe**: `demo123`

### ❓ Résolution de Problèmes

#### Erreur "Erreur de connexion au serveur"

1. **Vérifiez que le backend est démarré** sur le port 3001 :
   ```bash
   curl http://localhost:3001/api/health
   ```
   La réponse doit être : `{"status":"OK","timestamp":"..."}`

2. **Vérifiez que la base de données est initialisée** :
   ```bash
   cd backend
   npx prisma db push
   npx ts-node prisma/seed.ts
   ```

3. **Redémarrez les serveurs** :
   - Arrêtez tous les processus Node.js (`Ctrl+C` ou fermez les terminaux)
   - Redémarrez le backend d'abord, puis le frontend

#### Erreur "ts-node-dev n'est pas reconnu" (Windows)

Utilisez `npx` devant la commande :
```powershell
npx ts-node-dev --respawn --transpile-only src/index.ts
```

#### Erreur "Port 3000/3001 déjà utilisé"

Trouvez et tuez le processus utilisant le port :
- **Windows**: `netstat -ano | findstr :3000` puis `taskkill /PID <PID> /F`
- **Linux/macOS**: `lsof -i :3000` puis `kill -9 <PID>`

### Variables d'Environnement

```env
# Backend (.env)
DATABASE_URL="file:./dev.db"
JWT_SECRET="votre-secret-jwt-tres-securise"
PORT=3001

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

---

## 📚 API Documentation

### Authentification

```http
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
POST /api/auth/logout
```

### Clients

```http
GET    /api/clients
GET    /api/clients/:id
POST   /api/clients
PUT    /api/clients/:id
DELETE /api/clients/:id
```

### Produits

```http
GET    /api/produits
GET    /api/produits/stock-bas
GET    /api/produits/:id
POST   /api/produits
PUT    /api/produits/:id
DELETE /api/produits/:id
```

### Factures

```http
GET    /api/factures
GET    /api/factures/:id
GET    /api/factures/:id/pdf
POST   /api/factures
PUT    /api/factures/:id/statut
DELETE /api/factures/:id
```

### Paie Multi-Pays

```http
GET  /api/paie/config-pays          # Configuration fiscale du pays
GET  /api/paie/pays-supportes       # Liste des pays supportés
GET  /api/paie/bulletins            # Liste des bulletins
POST /api/paie/calculer             # Calcul de paie (preview)
POST /api/paie/bulletins            # Créer un bulletin
PUT  /api/paie/bulletins/:id/valider
PUT  /api/paie/bulletins/:id/payer
GET  /api/paie/rapport-cotisations  # Rapport CNSS
GET  /api/paie/rapport-imposition   # Rapport IPR/IR annuel
```

### Paramètres

```http
GET  /api/parametres/societe
PUT  /api/parametres/societe
PUT  /api/parametres/societe/fiscal
GET  /api/parametres/pays
GET  /api/parametres/profil
PUT  /api/parametres/profil
```

### Plans

```http
GET /api/plans
GET /api/plans/:id
GET /api/plans/abonnement/actuel
POST /api/plans/abonnement/changer
```

---

## 🧪 Tests

```bash
# Tests unitaires
cd backend
npm test

# Tests avec couverture
npm run test:coverage
```

---

## 📁 Structure du Projet

```
guineemenages/
├── src/                    # Frontend Next.js
│   ├── app/                # Pages et routes
│   ├── components/         # Composants React
│   │   ├── pages/          # Pages de l'application
│   │   └── ui/             # Composants UI (shadcn)
│   ├── lib/                # Utilitaires et API client
│   └── stores/             # State management (Zustand)
│
├── backend/                # Backend Express
│   ├── prisma/
│   │   ├── schema.prisma   # Schéma de la base de données
│   │   └── seed.ts         # Données initiales
│   ├── src/
│   │   ├── config/         # Configuration multi-pays
│   │   ├── middlewares/    # Middlewares Express
│   │   ├── routes/         # Routes API
│   │   └── utils/          # Utilitaires (paie, PDF, Excel)
│   └── tests/              # Tests unitaires
│
└── README.md
```

---

## 🤝 Contribution

Les contributions sont les bienvenues! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

### Étapes pour contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Push sur la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

---

## 📜 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Auteurs

- **GuinéaManager Team** - *Développement initial*

---

## 🙏 Remerciements

- Communauté open source africain
- Contributeurs et testeurs
- Partenaires locaux pour les informations fiscales

---

## 📞 Support

- **Email**: support@guineamanager.com
- **Documentation**: docs.guineamanager.com
- **Issues**: GitHub Issues

---

<p align="center">
  <strong>Fait avec ❤️ pour les entreprises africaines</strong>
</p>
