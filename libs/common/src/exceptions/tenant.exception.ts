import { HttpException, HttpStatus } from '@nestjs/common';

export enum TenantErrorCode {
  TENANT_REQUIRED = 'TENANT_REQUIRED',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  TENANT_EXPIRED = 'TENANT_EXPIRED',
  INVALID_TENANT_CONTEXT = 'INVALID_TENANT_CONTEXT',
}

export class TenantException extends HttpException {
  constructor(
    public readonly code: TenantErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        statusCode: status,
        errorCode: code,
        message,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
