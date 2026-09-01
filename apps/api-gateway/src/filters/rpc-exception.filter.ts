import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error('API Gateway Exception Captured:', JSON.stringify(exception, null, 2));

    // Standard NestJS HttpExceptions
    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json(exception.getResponse());
    }

    // Extract status code
    let statusCode = HttpStatus.BAD_REQUEST;
    if (typeof exception?.statusCode === 'number') {
      statusCode = exception.statusCode;
    } else if (typeof exception?.status === 'number') {
      statusCode = exception.status;
    } else if (exception?.status === 401 || exception?.statusCode === 401) {
      statusCode = HttpStatus.UNAUTHORIZED;
    }

    // Extract exact error message
    let message: string | string[] = 'An unexpected microservice error occurred';

    if (typeof exception?.message === 'string' && exception.message.length > 0) {
      message = exception.message;
    } else if (Array.isArray(exception?.message)) {
      message = exception.message;
    } else if (typeof exception?.response?.message === 'string') {
      message = exception.response.message;
    } else if (Array.isArray(exception?.response?.message)) {
      message = exception.response.message;
    } else if (typeof exception?.response === 'string') {
      message = exception.response;
    } else if (typeof exception?.error === 'string') {
      message = exception.error;
    }

    return response.status(statusCode).json({
      statusCode,
      message,
      error: statusCode === 401 ? 'Unauthorized' : 'Bad Request',
      timestamp: new Date().toISOString(),
    });
  }
}
