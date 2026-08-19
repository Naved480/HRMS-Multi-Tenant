export * from '../../../src/core/tenant/tenant.guard';
export * from '../../../src/core/decorators/user-tenant.decorator';

export const SERVICES = {
  AUTH_SERVICE: 'AUTH_SERVICE',
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
  ORGANIZATION: {
    GET_EMPLOYEES: 'org.get_employees',
  },
  PERFORMANCE_WORK: {
    CREATE_PROJECT: 'work.create_project',
    LINK_OUTPUT: 'work.link_output',
  },
};

