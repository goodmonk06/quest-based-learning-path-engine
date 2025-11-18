import dotenv from 'dotenv';

dotenv.config();

export const config = {
  api: {
    host: process.env.API_HOST || '0.0.0.0',
    port: parseInt(process.env.API_PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  externalServices: {
    soulProfileRegistryUrl: process.env.SOUL_PROFILE_REGISTRY_URL || 'http://localhost:3001',
    currencyEconomyCoreUrl: process.env.CURRENCY_ECONOMY_CORE_URL || 'http://localhost:3002',
    ritualEventOrchestratorUrl: process.env.RITUAL_EVENT_ORCHESTRATOR_URL || 'http://localhost:3003',
  },
};
