import { DatabaseConfig } from '../database.types';

export const getDatabaseConfig = (isPlatform: boolean): DatabaseConfig => {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isPlatform) {
    return {
      host: process.env.PLATFORM_DB_HOST || 'localhost',
      port: parseInt(process.env.PLATFORM_DB_PORT || '5432'),
      username: process.env.PLATFORM_DB_USER || 'postgres',
      password: process.env.PLATFORM_DB_PASSWORD || 'password',
      database: process.env.PLATFORM_DB_NAME || 'hrms_platform',
      dialect: 'postgres',
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
    host: process.env.TENANT_DB_HOST || 'localhost',
    port: parseInt(process.env.TENANT_DB_PORT || '5432'),
    username: process.env.TENANT_DB_USER || 'postgres',
    password: process.env.TENANT_DB_PASSWORD || 'password',
    database: 'tenant_template',
    dialect: 'postgres',
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
