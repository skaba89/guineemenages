// Serveur GuinéaManager

import app from './app';
import { config } from './utils/config';
import { checkDatabaseConnection, closePrisma } from './utils/prisma';
import { closeRedis } from './utils/redis';
import logger from './utils/logger';

// Démarrer le serveur
const startServer = async () => {
  try {
    // Vérifier la connexion à la base de données
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      logger.error('Impossible de se connecter à la base de données');
      process.exit(1);
    }
    logger.info('Connexion à la base de données établie');

    // Démarrer le serveur Express
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Serveur GuinéaManager démarré`, {
        port: config.port,
        environment: config.nodeEnv,
        url: config.apiUrl,
      });
    });

    // Gestion gracieuse de l'arrêt
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Signal ${signal} reçu. Arrêt en cours...`);
      
      server.close(async () => {
        logger.info('Serveur HTTP fermé');
        
        // Fermer les connexions
        await closePrisma();
        await closeRedis();
        
        logger.info('Toutes les connexions fermées');
        process.exit(0);
      });

      // Forcer l'arrêt après 10 secondes
      setTimeout(() => {
        logger.error('Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Erreur au démarrage du serveur', error);
    process.exit(1);
  }
};

// Démarrer
startServer();

export { startServer };
