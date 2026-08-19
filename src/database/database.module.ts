import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ALL_MODELS } from './models';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'hrms_db'),
        models: ALL_MODELS,
        autoLoadModels: true,
        synchronize: true, // Set to false in production with migrations
        logging: configService.get<string>('NODE_ENV') === 'development' ? console.log : false,
      }),
    }),
    SequelizeModule.forFeature(ALL_MODELS),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
