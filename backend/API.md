# API GuinéaManager - Documentation des Endpoints

Base URL: `http://localhost:3001/api`

---

## Table des matières

1. [Authentification](#authentification)
2. [Clients](#clients)
3. [Produits](#produits)
4. [Factures](#factures)
5. [Employés](#employés)
6. [Paie](#paie)
7. [Dépenses](#dépenses)
8. [Dashboard](#dashboard)

---

## Authentification

### POST /auth/login

Connexion d'un utilisateur.

**Corps de la requête:**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "clx123456",
      "email": "user@example.com",
      "nom": "Diallo",
      "prenom": "Mamadou",
      "role": "ADMIN",
      "company": {
        "id": "clx789012",
        "nom": "Mon Entreprise",
        "email": "contact@monentreprise.gn",
        "plan": "FREE"
      }
    }
  }
}
```

**Erreurs:**
- `400` - Données invalides
- `401` - Email ou mot de passe incorrect

---

### POST /auth/register

Inscription d'un nouvel utilisateur (crée également l'entreprise).

**Corps de la requête:**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "nom": "Diallo",
  "prenom": "Mamadou",
  "telephone": "+224 620 00 00 00",
  "companyName": "Mon Entreprise SARL"
}
```

**Réponse réussie (201):**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "clx123456",
      "email": "user@example.com",
      "nom": "Diallo",
      "prenom": "Mamadou",
      "role": "ADMIN",
      "company": {
        "id": "clx789012",
        "nom": "Mon Entreprise SARL",
        "plan": "FREE"
      }
    }
  }
}
```

**Erreurs:**
- `400` - Données invalides ou email déjà utilisé
- `500` - Erreur serveur

---

### GET /auth/me

Récupère le profil de l'utilisateur connecté.

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "email": "user@example.com",
    "nom": "Diallo",
    "prenom": "Mamadou",
    "telephone": "+224 620 00 00 00",
    "role": "ADMIN",
    "company": {
      "id": "clx789012",
      "nom": "Mon Entreprise SARL",
      "email": "contact@monentreprise.gn",
      "telephone": "+224 620 11 11 11",
      "adresse": "Conakry, Kaloum",
      "ville": "Conakry",
      "pays": "Guinée",
      "ninea": "GN123456789",
      "plan": "FREE",
      "devise": "GNF"
    }
  }
}
```

**Erreurs:**
- `401` - Token invalide ou expiré
- `404` - Utilisateur non trouvé

---

### POST /auth/logout

Déconnexion de l'utilisateur.

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

---

## Clients

> Tous les endpoints clients nécessitent une authentification.

### GET /clients

Liste des clients avec pagination et recherche.

**Paramètres de requête:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Recherche par nom, email, téléphone |
| `page` | number | Numéro de page (défaut: 1) |
| `limit` | number | Éléments par page (défaut: 50) |

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456",
      "nom": "Entreprise ABC",
      "email": "contact@abc.gn",
      "telephone": "+224 620 00 00 00",
      "adresse": "Conakry, Dixinn",
      "ville": "Conakry",
      "pays": "Guinée",
      "type": "ENTREPRISE",
      "totalAchats": 5,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

### GET /clients/:id

Détails d'un client avec ses dernières factures.

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "nom": "Entreprise ABC",
    "email": "contact@abc.gn",
    "telephone": "+224 620 00 00 00",
    "adresse": "Conakry, Dixinn",
    "ville": "Conakry",
    "pays": "Guinée",
    "type": "ENTREPRISE",
    "totalAchats": 5,
    "factures": [
      {
        "id": "clx789012",
        "numero": "FAC-2024-0001",
        "montantTTC": 1500000,
        "statut": "PAYEE",
        "dateEmission": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Erreurs:**
- `404` - Client non trouvé

---

### POST /clients

Créer un nouveau client.

**Corps de la requête:**
```json
{
  "nom": "Entreprise XYZ",
  "email": "contact@xyz.gn",
  "telephone": "+224 620 11 11 11",
  "adresse": "Conakry, Kaloum",
  "ville": "Conakry",
  "pays": "Guinée",
  "type": "ENTREPRISE"
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `nom` | string | Oui | Nom du client |
| `email` | string | Non | Email |
| `telephone` | string | Non | Téléphone |
| `adresse` | string | Non | Adresse |
| `ville` | string | Non | Ville |
| `pays` | string | Non | Pays (défaut: "Guinée") |
| `type` | enum | Non | `PARTICULIER` ou `ENTREPRISE` |

**Réponse réussie (201):**
```json
{
  "success": true,
  "message": "Client créé avec succès",
  "data": { ... }
}
```

---

### PUT /clients/:id

Modifier un client existant.

**Corps de la requête:**
```json
{
  "nom": "Nouveau Nom",
  "telephone": "+224 620 22 22 22"
}
```

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Client mis à jour",
  "data": { ... }
}
```

---

### DELETE /clients/:id

Supprimer un client.

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Client supprimé avec succès"
}
```

---

## Produits

> Tous les endpoints produits nécessitent une authentification.

### GET /produits

Liste des produits avec pagination et filtres.

**Paramètres de requête:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Recherche par nom ou description |
| `categorie` | string | Filtrer par catégorie |
| `page` | number | Numéro de page |
| `limit` | number | Éléments par page |

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456",
      "nom": "Service de consultation",
      "description": "Consultation juridique",
      "prixUnitaire": 500000,
      "unite": "Heure",
      "stockActuel": 0,
      "stockMin": 0,
      "categorie": "Services",
      "actif": true
    }
  ],
  "pagination": { ... }
}
```

---

### GET /produits/stock-bas

Liste des produits en stock bas (stockActuel <= stockMin).

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456",
      "nom": "Produit A",
      "stockActuel": 5,
      "stockMin": 10
    }
  ]
}
```

---

### GET /produits/:id

Détails d'un produit.

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "nom": "Service de consultation",
    "description": "Consultation juridique",
    "prixUnitaire": 500000,
    "unite": "Heure",
    "stockActuel": 0,
    "stockMin": 0,
    "categorie": "Services",
    "actif": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### POST /produits

Créer un nouveau produit.

**Corps de la requête:**
```json
{
  "nom": "Service de consultation",
  "description": "Consultation juridique horaire",
  "prixUnitaire": 500000,
  "unite": "Heure",
  "stockActuel": 0,
  "stockMin": 0,
  "categorie": "Services",
  "actif": true
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `nom` | string | Oui | Nom du produit |
| `description` | string | Non | Description |
| `prixUnitaire` | number | Oui | Prix en centimes (GNF) |
| `unite` | string | Non | Unité (défaut: "Unité") |
| `stockActuel` | number | Non | Stock actuel |
| `stockMin` | number | Non | Seuil d'alerte stock |
| `categorie` | string | Non | Catégorie |
| `actif` | boolean | Non | Actif (défaut: true) |

**Réponse réussie (201):**
```json
{
  "success": true,
  "message": "Produit créé avec succès",
  "data": { ... }
}
```

---

### PUT /produits/:id

Modifier un produit.

**Corps de la requête:**
```json
{
  "prixUnitaire": 600000,
  "stockMin": 10
}
```

---

### DELETE /produits/:id

Supprimer un produit.

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Produit supprimé"
}
```

---

## Factures

> Tous les endpoints factures nécessitent une authentification.

### GET /factures

Liste des factures avec pagination et filtres.

**Paramètres de requête:**
| Param | Type | Description |
|-------|------|-------------|
| `statut` | string | Filtrer par statut |
| `clientId` | string | Filtrer par client |
| `page` | number | Numéro de page |
| `limit` | number | Éléments par page |

**Statuts disponibles:**
- `BROUILLON` - Brouillon
- `ENVOYEE` - Envoyée
- `PAYEE` - Payée
- `EN_RETARD` - En retard
- `ANNULEE` - Annulée

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456",
      "numero": "FAC-2024-0001",
      "dateEmission": "2024-01-15T10:00:00.000Z",
      "dateEcheance": "2024-02-15T10:00:00.000Z",
      "montantHT": 1271186,
      "montantTVA": 228814,
      "montantTTC": 1500000,
      "statut": "PAYEE",
      "modePaiement": "ORANGE_MONEY",
      "client": {
        "id": "clx789012",
        "nom": "Entreprise ABC"
      },
      "lignes": [...]
    }
  ],
  "pagination": { ... }
}
```

---

### GET /factures/:id

Détails d'une facture avec lignes et paiements.

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "numero": "FAC-2024-0001",
    "dateEmission": "2024-01-15T10:00:00.000Z",
    "dateEcheance": "2024-02-15T10:00:00.000Z",
    "montantHT": 1271186,
    "montantTVA": 228814,
    "montantTTC": 1500000,
    "statut": "PAYEE",
    "modePaiement": "ORANGE_MONEY",
    "notes": "Paiement reçu par Orange Money",
    "client": {
      "id": "clx789012",
      "nom": "Entreprise ABC",
      "email": "contact@abc.gn",
      "telephone": "+224 620 00 00 00",
      "adresse": "Conakry, Dixinn",
      "ville": "Conakry",
      "pays": "Guinée"
    },
    "lignes": [
      {
        "id": "clx111111",
        "description": "Service de consultation",
        "quantite": 2,
        "prixUnitaire": 500000,
        "tauxTVA": 18,
        "montantHT": 1000000,
        "montantTVA": 180000,
        "montantTTC": 1180000
      },
      {
        "id": "clx222222",
        "description": "Frais de déplacement",
        "quantite": 1,
        "prixUnitaire": 271186,
        "tauxTVA": 18,
        "montantHT": 271186,
        "montantTVA": 48814,
        "montantTTC": 320000
      }
    ],
    "paiements": [
      {
        "id": "clx333333",
        "montant": 1500000,
        "date": "2024-01-20T14:30:00.000Z",
        "mode": "ORANGE_MONEY",
        "reference": "OM123456789"
      }
    ]
  }
}
```

---

### POST /factures

Créer une nouvelle facture.

**Corps de la requête:**
```json
{
  "clientId": "clx789012",
  "dateEcheance": "2024-02-15",
  "modePaiement": "ORANGE_MONEY",
  "notes": "Facture pour services de consultation",
  "lignes": [
    {
      "description": "Service de consultation",
      "quantite": 2,
      "prixUnitaire": 500000,
      "tauxTVA": 18,
      "produitId": "clx444444"
    },
    {
      "description": "Frais de déplacement",
      "quantite": 1,
      "prixUnitaire": 271186,
      "tauxTVA": 18
    }
  ]
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `clientId` | string | Oui | ID du client |
| `dateEcheance` | string | Oui | Date d'échéance (YYYY-MM-DD) |
| `modePaiement` | string | Non | Mode de paiement |
| `notes` | string | Non | Notes |
| `lignes` | array | Oui | Lignes de facture |

**Modes de paiement:**
- `ESPECES` - Espèces
- `VIREMENT` - Virement bancaire
- `ORANGE_MONEY` - Orange Money
- `MTN_MONEY` - MTN Mobile Money
- `CHEQUE` - Chèque
- `CARTE` - Carte bancaire

**Réponse réussie (201):**
```json
{
  "success": true,
  "message": "Facture créée",
  "data": {
    "id": "clx123456",
    "numero": "FAC-2024-0001",
    ...
  }
}
```

---

### PUT /factures/:id/statut

Modifier le statut d'une facture.

**Corps de la requête:**
```json
{
  "statut": "PAYEE"
}
```

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Statut mis à jour",
  "data": { ... }
}
```

---

### DELETE /factures/:id

Supprimer une facture.

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Facture supprimée"
}
```

---

### GET /factures/:id/pdf

Télécharger le PDF d'une facture.

**Réponse:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="facture-FAC-2024-0001.pdf"`

---

## Employés

> Tous les endpoints employés nécessitent une authentification.

### GET /employes

Liste des employés avec pagination et filtres.

**Paramètres de requête:**
| Param | Type | Description |
|-------|------|-------------|
| `departement` | string | Filtrer par département |
| `actif` | boolean | Filtrer par statut actif |
| `search` | string | Recherche par nom, prénom, matricule |
| `page` | number | Numéro de page |
| `limit` | number | Éléments par page |

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456",
      "matricule": "EMP001",
      "nom": "Diallo",
      "prenom": "Fatou",
      "email": "fatou@entreprise.gn",
      "telephone": "+224 620 00 00 00",
      "poste": "Comptable",
      "departement": "Finance",
      "salaireBase": 300000000,
      "typeContrat": "CDI",
      "actif": true,
      "dateEmbauche": "2023-01-15T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### GET /employes/:id

Détails d'un employé avec ses derniers bulletins.

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "matricule": "EMP001",
    "nom": "Diallo",
    "prenom": "Fatou",
    "email": "fatou@entreprise.gn",
    "telephone": "+224 620 00 00 00",
    "adresse": "Conakry, Dixinn",
    "dateNaissance": "1990-05-15T00:00:00.000Z",
    "dateEmbauche": "2023-01-15T00:00:00.000Z",
    "poste": "Comptable",
    "departement": "Finance",
    "salaireBase": 300000000,
    "typeContrat": "CDI",
    "actif": true,
    "bulletins": [
      {
        "id": "clx789012",
        "mois": 12,
        "annee": 2024,
        "netAPayer": 265000000,
        "statut": "PAYE"
      }
    ]
  }
}
```

---

### POST /employes

Créer un nouvel employé.

**Corps de la requête:**
```json
{
  "matricule": "EMP002",
  "nom": "Camara",
  "prenom": "Ibrahima",
  "email": "ibrahima@entreprise.gn",
  "telephone": "+224 620 11 11 11",
  "adresse": "Conakry, Kaloum",
  "dateNaissance": "1985-08-20",
  "dateEmbauche": "2024-01-15",
  "poste": "Gestionnaire de stock",
  "departement": "Logistique",
  "salaireBase": 250000000,
  "typeContrat": "CDI"
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `matricule` | string | Oui | Matricule unique |
| `nom` | string | Oui | Nom |
| `prenom` | string | Oui | Prénom |
| `email` | string | Non | Email |
| `telephone` | string | Non | Téléphone |
| `adresse` | string | Non | Adresse |
| `dateNaissance` | string | Non | Date de naissance |
| `dateEmbauche` | string | Oui | Date d'embauche |
| `poste` | string | Oui | Poste occupé |
| `departement` | string | Non | Département |
| `salaireBase` | number | Oui | Salaire de base en centimes |
| `typeContrat` | enum | Non | `CDI`, `CDD`, `APPRENTISSAGE`, `STAGE` |

**Réponse réussie (201):**
```json
{
  "success": true,
  "message": "Employé créé",
  "data": { ... }
}
```

---

### PUT /employes/:id

Modifier un employé.

**Corps de la requête:**
```json
{
  "poste": "Chef comptable",
  "salaireBase": 350000000
}
```

---

### DELETE /employes/:id

Désactiver un employé (soft delete).

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Employé désactivé"
}
```

---

## Paie

> Tous les endpoints paie nécessitent une authentification.

### GET /paie/bulletins

Liste des bulletins de paie.

**Paramètres de requête:**
| Param | Type | Description |
|-------|------|-------------|
| `mois` | number | Filtrer par mois (1-12) |
| `annee` | number | Filtrer par année |
| `employeId` | string | Filtrer par employé |
| `page` | number | Numéro de page |
| `limit` | number | Éléments par page |

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456",
      "mois": 12,
      "annee": 2024,
      "salaireBase": 300000000,
      "heuresSupplementaires": 10,
      "montantHeuresSupp": 15000000,
      "primes": 50000000,
      "brutTotal": 365000000,
      "cnssEmploye": 18250000,
      "cnssEmployeur": 65700000,
      "ipr": 35000000,
      "netAPayer": 311750000,
      "coutTotalEmployeur": 430700000,
      "statut": "PAYE",
      "datePaiement": "2024-12-31T10:00:00.000Z",
      "employe": {
        "id": "clx789012",
        "matricule": "EMP001",
        "nom": "Diallo",
        "prenom": "Fatou"
      }
    }
  ],
  "pagination": { ... }
}
```

---

### POST /paie/calculer

Calculer la paie sans créer de bulletin.

**Corps de la requête:**
```json
{
  "salaireBase": 3000000,
  "heuresSupplementaires": 10,
  "tauxHoraire": 15000,
  "primes": 500000,
  "indemnites": 0,
  "autresAvantages": 0,
  "acomptes": 0,
  "autresRetenues": 0
}
```

> Note: Tous les montants sont en GNF (pas en centimes pour cet endpoint)

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": {
    "brutTotal": 365000000,
    "cnssEmploye": 18250000,
    "cnssEmployeur": 65700000,
    "ipr": 35000000,
    "netAPayer": 311750000,
    "coutTotalEmployeur": 430700000,
    "brutTotalGNF": 3650000,
    "cnssEmployeGNF": 182500,
    "cnssEmployeurGNF": 657000,
    "iprGNF": 350000,
    "netAPayerGNF": 3117500,
    "coutTotalEmployeurGNF": 4307000
  }
}
```

---

### POST /paie/bulletins

Créer un bulletin de paie.

**Corps de la requête:**
```json
{
  "employeId": "clx789012",
  "mois": 12,
  "annee": 2024,
  "heuresSupplementaires": 10,
  "tauxHoraire": 1500000,
  "primes": 50000000,
  "indemnites": 0,
  "autresAvantages": 0,
  "acomptes": 0,
  "autresRetenues": 0
}
```

**Réponse réussie (201):**
```json
{
  "success": true,
  "message": "Bulletin créé",
  "data": {
    "id": "clx123456",
    "mois": 12,
    "annee": 2024,
    "statut": "BROUILLON",
    ...
  }
}
```

**Erreurs:**
- `400` - Un bulletin existe déjà pour ce mois
- `404` - Employé non trouvé

---

### PUT /paie/bulletins/:id/valider

Valider un bulletin (passe de BROUILLON à VALIDE).

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Bulletin validé",
  "data": {
    "id": "clx123456",
    "statut": "VALIDE",
    ...
  }
}
```

---

### PUT /paie/bulletins/:id/payer

Marquer un bulletin comme payé.

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Bulletin marqué comme payé",
  "data": {
    "id": "clx123456",
    "statut": "PAYE",
    "datePaiement": "2024-12-31T10:00:00.000Z",
    ...
  }
}
```

---

### GET /paie/masse-salariale

Calculer la masse salariale totale.

**Paramètres de requête:**
| Param | Type | Description |
|-------|------|-------------|
| `mois` | number | Filtrer par mois |
| `annee` | number | Filtrer par année |

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": {
    "totalNetGNF": 15587500,
    "totalCoutEmployeurGNF": 21535000,
    "nombreBulletins": 5
  }
}
```

---

## Dépenses

> Tous les endpoints dépenses nécessitent une authentification.

### GET /depenses

Liste des dépenses.

**Paramètres de requête:**
| Param | Type | Description |
|-------|------|-------------|
| `categorie` | string | Filtrer par catégorie |
| `mois` | string | Filtrer par mois (YYYY-MM) |
| `page` | number | Numéro de page |
| `limit` | number | Éléments par page |

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456",
      "description": "Achat de fournitures de bureau",
      "montant": 500000,
      "categorie": "Fournitures",
      "date": "2024-01-15T00:00:00.000Z",
      "modePaiement": "ESPECES",
      "notes": "Papier, stylos, agrafes"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /depenses

Enregistrer une dépense.

**Corps de la requête:**
```json
{
  "description": "Facture électricité",
  "montant": 1500000,
  "categorie": "Énergie",
  "date": "2024-01-15",
  "modePaiement": "ORANGE_MONEY",
  "notes": "Paiement facture EDG janvier 2024"
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `description` | string | Oui | Description |
| `montant` | number | Oui | Montant en centimes |
| `categorie` | string | Oui | Catégorie |
| `date` | string | Oui | Date (YYYY-MM-DD) |
| `modePaiement` | enum | Oui | Voir modes de paiement |
| `notes` | string | Non | Notes |

**Réponse réussie (201):**
```json
{
  "success": true,
  "message": "Dépense enregistrée",
  "data": { ... }
}
```

---

### PUT /depenses/:id

Modifier une dépense.

**Corps de la requête:**
```json
{
  "montant": 1600000,
  "notes": "Montant révisé après réclamation"
}
```

---

### DELETE /depenses/:id

Supprimer une dépense.

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Dépense supprimée"
}
```

---

## Dashboard

> Tous les endpoints dashboard nécessitent une authentification.

### GET /dashboard/stats

Statistiques globales du tableau de bord.

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": {
    "caMois": 15000000,
    "caAnnee": 180000000,
    "facturesEnAttente": 5,
    "facturesEnRetard": 2,
    "clientsActifs": 25,
    "produitsStockBas": 3,
    "masseSalarialeMois": 8500000,
    "depensesMois": 2500000
  }
}
```

| Champ | Description |
|-------|-------------|
| `caMois` | Chiffre d'affaires du mois (GNF) |
| `caAnnee` | Chiffre d'affaires de l'année (GNF) |
| `facturesEnAttente` | Nombre de factures envoyées non payées |
| `facturesEnRetard` | Nombre de factures en retard |
| `clientsActifs` | Nombre total de clients |
| `produitsStockBas` | Nombre de produits sous le seuil |
| `masseSalarialeMois` | Masse salariale du mois (GNF) |
| `depensesMois` | Total des dépenses du mois (GNF) |

---

### GET /dashboard/factures-recentes

10 dernières factures.

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456",
      "numero": "FAC-2024-0001",
      "montantTTC": 1500000,
      "statut": "PAYEE",
      "dateEmission": "2024-01-15T10:00:00.000Z",
      "client": {
        "id": "clx789012",
        "nom": "Entreprise ABC"
      }
    }
  ]
}
```

---

### GET /dashboard/alertes

Alertes du tableau de bord.

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": {
    "stockBas": [
      {
        "id": "clx123456",
        "nom": "Produit A",
        "stockActuel": 2,
        "stockMin": 10
      }
    ],
    "facturesRetard": [
      {
        "id": "clx789012",
        "numero": "FAC-2023-0045",
        "montantTTC": 2000000,
        "dateEcheance": "2023-12-15T00:00:00.000Z",
        "client": {
          "id": "clx111111",
          "nom": "Client XYZ"
        }
      }
    ]
  }
}
```

---

## Codes d'erreur HTTP

| Code | Description |
|------|-------------|
| `200` | Succès |
| `201` | Créé avec succès |
| `400` | Requête invalide (erreur de validation) |
| `401` | Non authentifié (token manquant ou invalide) |
| `403` | Accès interdit (permissions insuffisantes) |
| `404` | Ressource non trouvée |
| `500` | Erreur serveur interne |

---

## Authentification

Toutes les routes protégées nécessitent un header `Authorization`:

```
Authorization: Bearer <votre-token-jwt>
```

Le token est obtenu via les endpoints `/auth/login` ou `/auth/register`.

---

## Pagination

Les endpoints de liste supportent la pagination via les paramètres:
- `page`: Numéro de page (défaut: 1)
- `limit`: Éléments par page (défaut: 50)

La réponse inclut un objet `pagination`:
```json
{
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 50,
    "totalPages": 3
  }
}
```
