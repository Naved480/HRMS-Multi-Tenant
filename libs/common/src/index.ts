export * from './exceptions';
export * from './filters';
export * from './guards';
export * from './interceptors';
export * from './pipes';
export * from './utils';
export * from './dto/auth.dto';
export * from './dto/organization.dto';
export * from './dto/invitation.dto';
export * from './dto/setup.dto';
export * from './dto/policy.dto';
export * from './decorators';
export * from './context/request-context.interface';

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
  HEALTH: {
    CHECK: 'health.check',
  },
  AUTH: {
    REGISTER_TENANT: 'auth.register_tenant',
    LOGIN: 'auth.login',
    SUPERADMIN_LOGIN: 'auth.superadmin_login',
    ONBOARD_ORGANIZATION: 'auth.onboard_organization',
    FORGOT_PASSWORD: 'auth.forgot_password',
    VERIFY_OTP: 'auth.verify_otp',
    RESET_PASSWORD: 'auth.reset_password',
    CREATE_ADMIN_CREDENTIAL: 'auth.create_admin_credential',
  },
  TENANT: {
    GET_TENANT: 'tenant.get',
    CREATE_TENANT: 'tenant.create',
    PROVISION_TENANT: 'tenant.provision',
    RETRY_PROVISION: 'tenant.retry_provision',
  },
  INVITATION: {
    CREATE: 'invitation.create',
    RESEND: 'invitation.resend',
    VALIDATE: 'invitation.validate',
    ACTIVATE: 'invitation.activate',
  },
  USER: {
    GET_USER: 'user.get',
    CREATE_USER: 'user.create',
    CREATE_ORGANIZATION_ADMIN: 'user.create_organization_admin',
  },
  ORGANIZATION: {
    CREATE_ORGANIZATION: 'org.create_organization',
    GET_EMPLOYEES: 'org.get_employees',
  },
  ORGANIZATION_SETUP: {
    GET_PROGRESS: 'org_setup.get_progress',
    UPDATE_PROFILE: 'org_setup.update_profile',
    GET_DEPARTMENTS: 'org_setup.get_departments',
    CREATE_DEPARTMENT: 'org_setup.create_department',
    UPDATE_DEPARTMENT: 'org_setup.update_department',
    DELETE_DEPARTMENT: 'org_setup.delete_department',
    GET_DESIGNATIONS: 'org_setup.get_designations',
    CREATE_DESIGNATION: 'org_setup.create_designation',
    UPDATE_DESIGNATION: 'org_setup.update_designation',
    DELETE_DESIGNATION: 'org_setup.delete_designation',
    GET_WORKING_HOURS: 'org_setup.get_working_hours',
    UPDATE_WORKING_HOURS: 'org_setup.update_working_hours',
    GET_LEAVE_POLICIES: 'org_setup.get_leave_policies',
    CREATE_LEAVE_POLICY: 'org_setup.create_leave_policy',
    UPDATE_LEAVE_POLICY: 'org_setup.update_leave_policy',
    DELETE_LEAVE_POLICY: 'org_setup.delete_leave_policy',
    GET_ATTENDANCE_POLICY: 'org_setup.get_attendance_policy',
    UPDATE_ATTENDANCE_POLICY: 'org_setup.update_attendance_policy',
    COMPLETE_SETUP: 'org_setup.complete_setup',
  },
  ORGANIZATION_POLICY: {
    CREATE: 'org_policy.create',
    GET_ALL: 'org_policy.get_all',
    GET_ONE: 'org_policy.get_one',
    UPDATE: 'org_policy.update',
    DELETE: 'org_policy.delete',
    ACTIVATE: 'org_policy.activate',
    DEACTIVATE: 'org_policy.deactivate',
    ARCHIVE: 'org_policy.archive',
    GET_ACTIVE: 'org_policy.get_active',
    GET_VERSIONS: 'org_policy.get_versions',
    CREATE_VERSION: 'org_policy.create_version',
  },
  PERFORMANCE_WORK: {
    CREATE_PROJECT: 'work.create_project',
    LINK_OUTPUT: 'work.link_output',
  },
};
