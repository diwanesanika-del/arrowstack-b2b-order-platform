import app from './app.js';
import { initDatabase, pool } from './config/db.js';
import { runMigrations } from './db/migrate.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database (Real PostgreSQL with automatic embedded fallback if port 5432 is inactive)
    await initDatabase();

    const server = app.listen(PORT, () => {
      console.log(`🚀 B2B Order Platform REST API is running on http://localhost:${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`📦 Catalog API available at http://localhost:${PORT}/api/products`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await pool.end();
        console.log('🔒 Database connections closed. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    console.error('❌ Failed to start B2B platform backend server:', err.message);
    process.exit(1);
  }
}

startServer();
