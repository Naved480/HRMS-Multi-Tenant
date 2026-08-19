import { SequelizeOptions } from 'sequelize-typescript';

export interface IDatabaseConfig extends SequelizeOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}

export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
