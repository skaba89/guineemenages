#!/bin/bash

# GuinéaManager - Script de démarrage

echo "🚀 Démarrage de GuinéaManager..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier si le backend existe
if [ ! -d "backend" ]; then
    echo "❌ Dossier backend non trouvé!"
    exit 1
fi

# Démarrer le backend
echo -e "${BLUE}📦 Démarrage du backend...${NC}"
cd backend

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances backend..."
    npm install
fi

# Vérifier si la base de données existe
if [ ! -f "prisma/dev.db" ]; then
    echo "Initialisation de la base de données..."
    npx prisma generate
    npx prisma db push --force-reset
    npx ts-node prisma/seed.ts
fi

# Démarrer le backend en arrière-plan
npx ts-node-dev --respawn --transpile-only src/index.ts &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend démarré (PID: $BACKEND_PID)${NC}"

# Retourner au dossier principal
cd ..

# Démarrer le frontend
echo -e "${BLUE}🌐 Démarrage du frontend...${NC}"

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances frontend..."
    npm install
fi

# Démarrer le frontend
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend démarré (PID: $FRONTEND_PID)${NC}"

echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 GuinéaManager est prêt!${NC}"
echo ""
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "   🔑 Identifiants de démo:"
echo "      Email: demo@guineamanager.com"
echo "      Mot de passe: demo123"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs..."

# Attendre que l'utilisateur appuie sur Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
