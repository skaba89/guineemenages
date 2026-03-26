# Guide de Déploiement - GuinéaManager ERP

## Prérequis

- Docker et Docker Compose installés
- Git installé
- Au moins 2GB de RAM disponible

## Déploiement Rapide

### 1. Cloner le repository

```bash
git clone https://github.com/skaba89/guineemenages.git
cd guineemenages
```

### 2. Construire et lancer avec Docker

```bash
# Construction de l'image (première fois)
docker compose build --no-cache

# Lancement des conteneurs
docker compose up -d

# Voir les logs
docker compose logs -f
```

### 3. Accéder à l'application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Identifiants Demo**: demo@guineamanager.com / demo123

## Structure des Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Interface utilisateur Next.js |
| Backend | 3001 | API Express/Node.js |

## Variables d'Environnement

Le fichier `docker-compose.yml` contient les variables par défaut. Pour personnaliser:

```yaml
environment:
  - JWT_SECRET=votre-secret-jwt-personnalise
  - DATABASE_URL=file:/app/data/prod.db
```

## Volumes Persistants

Les données sont stockées dans des volumes Docker:

- `guineamanager-data`: Base de données SQLite
- `guineamanager-uploads`: Fichiers uploadés

## Commandes Utiles

```bash
# Arrêter les conteneurs
docker compose down

# Redémarrer
docker compose restart

# Voir les logs
docker compose logs -f app

# Reconstruire après modifications
docker compose build --no-cache && docker compose up -d

# Accéder au conteneur
docker exec -it guineamanager sh

# Sauvegarder les données
docker run --rm -v guineamanager-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

## Dépannage

### Erreur de permission sur logs

Le logger utilise maintenant `console` uniquement, plus de fichiers. Cette erreur est corrigée.

### Erreur Redis

Redis est optionnel. L'application fonctionne sans Redis.

### Erreur PWA/Service Worker

Le fichier `sw.js` et `offline.html` sont configurés correctement.

### Base de données

La base SQLite est créée automatiquement au premier démarrage avec:
- Plans d'abonnement (PETITE, MOYENNE, GRANDE, ENTERPRISE)
- Utilisateur demo (demo@guineamanager.com / demo123)
- Société demo

## Production

Pour la production, modifiez:

1. `JWT_SECRET` - Utilisez un secret fort
2. Configurez HTTPS avec un reverse proxy (nginx, traefik)
3. Configurez les sauvegardes automatiques
4. Optionnel: Utilisez PostgreSQL au lieu de SQLite

### Option PostgreSQL (recommandé production)

Décommentez la section `db` dans `docker-compose.yml` et modifiez:
```yaml
environment:
  - DATABASE_URL=postgresql://guineamanager:password@db:5432/guineamanager
```

## Support

- Email: support@guineamanager.com
- GitHub Issues: https://github.com/skaba89/guineemenages/issues
