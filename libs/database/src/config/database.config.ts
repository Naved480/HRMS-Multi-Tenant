import { DatabaseConfig } from '../database.types';

export const getDatabaseConfig = (isPlatform: boolean): DatabaseConfig => {
  const isDev = process.env.NODE_ENV !== 'production';

  const dbUrl = process.env.PLATFORM_DB_URL || process.env.DATABASE_URL;
  const platformHost = process.env.PLATFORM_DB_HOST || 'localhost';
  const tenantHost = process.env.TENANT_DB_HOST || 'localhost';

  const isSSL =
    dbUrl?.includes('sslmode=require') ||
    platformHost.includes('neon.tech') ||
    tenantHost.includes('neon.tech') ||
    process.env.DB_SSL === 'true';

  const dialectOptions = isSSL ? { ssl: { require: true, rejectUnauthorized: false } } : undefined;

  if (isPlatform) {
    return {
      host: platformHost,
      port: parseInt(process.env.PLATFORM_DB_PORT || '5432'),
      username: process.env.PLATFORM_DB_USER || 'postgres',
      password: process.env.PLATFORM_DB_PASSWORD || 'password',
      database: process.env.PLATFORM_DB_NAME || 'neondb',
      dialect: 'postgres',
      dialectOptions,
      logging: isDev ? console.log : false,
      synchronize: isDev,
      autoLoadEntities: true,
      pool: {
        max: 10,
        min: 2,
        idle: 10000,
      },
    };
  }

  // Template for tenant databases
  return {
    host: tenantHost,
    port: parseInt(process.env.TENANT_DB_PORT || '5432'),
    username: process.env.TENANT_DB_USER || 'postgres',
    password: process.env.TENANT_DB_PASSWORD || 'password',
    database: process.env.PLATFORM_DB_NAME || 'neondb',
    dialect: 'postgres',
    dialectOptions,
    logging: isDev ? console.log : false,
    synchronize: isDev,
    autoLoadEntities: true,
    pool: {
      max: 5,
      min: 1,
      idle: 10000,
    },
  };
};
