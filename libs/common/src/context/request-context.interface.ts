export interface RequestContextPayload {
  requestId: string;
  tenantId?: string;
  tenantSlug?: string;
  userId?: string;
  userType?: 'superadmin' | 'tenant_user';
  roles?: string[];
  permissions?: string[];
}

export interface CurrentUserPayload {
  id: string;
  email: string;
  tenantId?: string;
  role?: string;
  isSuperAdmin?: boolean;
}
