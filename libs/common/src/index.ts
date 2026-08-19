export * from './exceptions';
export * from './filters';
export * from './guards';
export * from './interceptors';
export * from './pipes';
export * from './utils';
export * from './dto/auth.dto';

export const SERVICES = {
  AUTH_SERVICE: 'AUTH_SERVICE',
  TENANT_SERVICE: 'TENANT_SERVICE',
  USER_SERVICE: 'USER_SERVICE',
  ORGANIZATION_SERVICE: 'ORGANIZATION_SERVICE',
  ATTENDANCE_LEAVE_SERVICE: 'ATTENDANCE_LEAVE_SERVICE',
  PAYROLL_SERVICE: 'PAYROLL_SERVICE',
  PERFORMANCE_WORK_SERVICE: 'PERFORMANCE_WORK_SERVICE',
  RECRUITMENT_SERVICE: 'RECRUITMENT_SERVICE',
  LMS_SERVICE: 'LMS_SERVICE',
};

export const MESSAGE_PATTERNS = {
  AUTH: {
    REGISTER_TENANT: 'auth.register_tenant',
    LOGIN: 'auth.login',
    SUPERADMIN_LOGIN: 'auth.superadmin_login',
    ONBOARD_ORGANIZATION: 'auth.onboard_organization',
    FORGOT_PASSWORD: 'auth.forgot_password',
    VERIFY_OTP: 'auth.verify_otp',
    RESET_PASSWORD: 'auth.reset_password',
  },
  TENANT: {
    GET_TENANT: 'tenant.get',
    CREATE_TENANT: 'tenant.create',
  },
  USER: {
    GET_USER: 'user.get',
    CREATE_USER: 'user.create',
  },
  ORGANIZATION: {
    GET_EMPLOYEES: 'org.get_employees',
  },
  PERFORMANCE_WORK: {
    CREATE_PROJECT: 'work.create_project',
    LINK_OUTPUT: 'work.link_output',
  },
};
