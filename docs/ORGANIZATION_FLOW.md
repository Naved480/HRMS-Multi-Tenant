# End-to-End Organization (Tenant) Lifecycle & Execution Flow

> **Document Version**: 1.0.0  
> **Platform**: HRMS Multi-Tenant Microservices System  
> **Target Audience**: Software Engineers, System Architects, & DevOps Engineers  

---

## 1. Overview

This document details the complete end-to-end **Organization (Tenant) Lifecycle Flow** within the HRMS Multi-Tenant Platform. It covers every stage from organization onboarding and automated database provisioning to request context resolution, RBAC permission checks, dynamic connection pooling, and organization deprovisioning.

---

## 2. High-Level Architecture Flowchart

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               1. ONBOARDING PHASE                                │
│                                                                                  │
│   Client/User ──────► API Gateway ──────► Auth Microservice ───► Tenant Service │
│                           (Port 3000)        (Port 3001)           (Port 3002)   │
│                                                                      │           │
│                                                                      ▼           │
│                                                          CREATE DATABASE         │
│                                                          hrms_<tenant_id>        │
└──────────────────────────────────────────────────────────────────────┬───────────┘
                                                                       │
┌──────────────────────────────────────────────────────────────────────▼───────────┐
│                               2. REQUEST PHASE                                   │
│                                                                                  │
│   Client Request ───► TenantResolverMiddleware ───► TenantGuard                   │
│   (x-tenant-id)               │                            │                     │
│                               ▼                            ▼                     │
│                   TenantConnectionManager       TenantModelProviderService       │
│                           │                            │                         │
│                           ▼                            ▼                         │
│               [ Get/Cache Tenant DB Connection ] ──► [ Query Tenant Database ]  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Execution Phases

---

### Phase 1: Organization Onboarding & Database Provisioning

The onboarding flow can be triggered either via **Public Self-Service Sign-up** (`POST /api/v1/auth/register-tenant`) or **SuperAdmin Admin Portal** (`POST /api/v1/superadmin/organizations/onboard`).

```mermaid
sequenceDiagram
    autonumber
    actor Client as Customer / Admin
    participant Gateway as API Gateway (3000)
    participant Auth as Auth Service (3001)
    participant TenantSvc as Tenant Service (3002)
    participant Manager as TenantConnectionManager
    participant DB as PostgreSQL Server

    Client->>Gateway: POST /api/v1/auth/register-tenant { companyName, domain, adminEmail, password }
    Gateway->>Auth: TCP Message (AUTH.REGISTER_TENANT)
    Auth->>Auth: Validate email uniqueness & hash password (bcrypt)
    Auth->>Auth: Create AuthCredential & Platform Tenant record
    Auth->>TenantSvc: TCP Message (TENANT.PROVISION)
    TenantSvc->>DB: CREATE DATABASE "hrms_<tenant_id>";
    TenantSvc->>DB: Connect to new database & run model sync (sequelize.sync())
    TenantSvc->>DB: Save DB credentials into tenant_database_configs
    TenantSvc-->>Auth: Provisioning Successful Response
    Auth->>Auth: Generate JWT signed token (sub, email, tenantId, role)
    Auth-->>Gateway: Return { message, tenantId, accessToken }
    Gateway-->>Client: HTTP 201 Created
```

#### Detailed Breakdown:
1. **Request Reception**: Client submits organization registration payload containing `companyName`, `domain`, `adminEmail`, `password`, `firstName`, and `lastName`.
2. **Credential Validation & Hashing**: Auth Service checks if `adminEmail` is already registered. If valid, hashes the password using `bcrypt`.
3. **Platform Credential Creation**: Creates an `AuthCredential` record mapping the user to a uniquely generated `tenantId` (`tenant-<domain>`).
4. **Database Provisioning (`TenantProvisioningService`)**:
   - Executes SQL statement: `CREATE DATABASE "hrms_<tenant_id>";`
   - Initializes connection to `hrms_<tenant_id>` and runs `sequelize.sync({ force: false })` to create all required tables (`users`, `roles`, `departments`, `employee_profiles`, `tasks`, etc.).
   - Stores connection configuration (`host`, `port`, `dbName`, `username`, `password`) in the platform `tenant_database_configs` table.
5. **JWT Issuance**: Signs a JWT containing contextual claims:
   ```json
   {
     "sub": "user-uuid-1234",
     "email": "admin@acme.com",
     "tenantId": "tenant-acme",
     "role": "Admin"
   }
   ```

---

### Phase 2: User Authentication & Login Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Gateway as API Gateway
    participant Auth as Auth Microservice
    participant DB as Platform Database

    User->>Gateway: POST /api/v1/auth/login { email, password }
    Gateway->>Auth: TCP Message (AUTH.LOGIN)
    Auth->>DB: Find AuthCredential by email
    Auth->>Auth: Compare password hash (bcrypt.compare)
    Auth->>Auth: Check if credential isActive == true
    Auth->>Auth: Sign JWT Token with tenantId & role claims
    Auth-->>Gateway: Return { accessToken, user: { id, email, tenantId, role } }
    Gateway-->>User: HTTP 200 OK + JWT Token
```

---

### Phase 3: Tenant Request Resolution & Database Connection Isolation

Every incoming operational request for an organization must be scoped to that specific organization's database.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Gateway as API Gateway
    participant Middleware as TenantResolverMiddleware
    participant Guard as TenantGuard
    participant ConnManager as TenantConnectionManager
    participant ModelProvider as TenantModelProviderService
    participant TenantDB as Tenant Database (hrms_acme_db)

    Client->>Gateway: GET /api/v1/users (Headers: Authorization & x-tenant-id)
    Gateway->>Middleware: Intercept Request
    Middleware->>Middleware: Extract x-tenant-id header / JWT token tenantId claim
    Middleware->>Guard: Pass request context
    Guard->>Guard: Validate tenant active status & matching permissions
    Guard->>ConnManager: getConnection(tenantId)
    alt Connection in Cache
        ConnManager-->>ModelProvider: Return cached Sequelize Instance
    else Connection Not Cached
        ConnManager->>ConnManager: Fetch credentials from tenant_database_configs
        ConnManager->>TenantDB: Authenticate & initialize pool (min: 1, max: 5)
        ConnManager-->>ModelProvider: Return new Sequelize Instance
    end
    ModelProvider->>TenantDB: Execute query (e.g. SELECT * FROM users)
    TenantDB-->>ModelProvider: Query Result Set
    ModelProvider-->>Gateway: Processed Business Response
    Gateway-->>Client: HTTP 200 OK Response Data
```

#### Key Technical Components:
- **`TenantResolverMiddleware`**: Reads the `x-tenant-id` header or decodes bearer JWT token claims to determine tenant context.
- **`TenantConnectionManager`**: Maintains an in-memory Map (`Map<string, Sequelize>`) of active database connection pools. This guarantees high performance without reconnecting on every HTTP request.
- **`TenantModelProviderService`**: Dynamically binds Sequelize models to the target tenant connection instance so queries run exclusively against `hrms_<tenant_id>`.

---

### Phase 4: Role-Based Access Control (RBAC) Enforcement Flow

Inside a tenant's organization, users have specific Roles and Permissions.

```
Incoming Request
       │
       ▼
┌──────────────┐      Valid Header?
│ TenantGuard  │ ─────────────────────────► NO ──► 401 Unauthorized
└──────┬───────┘
       │ YES
       ▼
┌──────────────┐      Role Allowed?
│  RolesGuard  │ ─────────────────────────► NO ──► 403 Forbidden
└──────┬───────┘
       │ YES
       ▼
┌─────────────────┐   Has Required Permission?
│PermissionsGuard │ ─────────────────────────► NO ──► 403 Forbidden
└──────┬──────────┘
       │ YES
       ▼
Execute Controller Handler
```

- `@RequireRoles('Admin', 'Manager')`: Restricts endpoint access to specific roles.
- `@RequirePermissions('user:create', 'payroll:process')`: Restricts endpoint access to users assigned specific granular permissions.

---

### Phase 5: Organization Offboarding & Deprovisioning Flow

When an organization cancels their subscription or is deactivated by a SuperAdmin:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as SuperAdmin
    participant Gateway as API Gateway
    participant TenantSvc as Tenant Service
    participant Manager as TenantConnectionManager
    participant DB as PostgreSQL Server

    Admin->>Gateway: DELETE /api/v1/superadmin/organizations/:tenantId
    Gateway->>TenantSvc: TCP Message (TENANT.DEPROVISION)
    TenantSvc->>Manager: closeConnection(tenantId)
    Manager->>Manager: Close Sequelize pool & remove from memory cache
    TenantSvc->>DB: Terminate active connections (pg_terminate_backend)
    TenantSvc->>DB: DROP DATABASE IF EXISTS "hrms_<tenant_id>";
    TenantSvc->>DB: Delete tenant_database_configs record
    TenantSvc->>DB: Delete Tenant record from platform database
    TenantSvc-->>Gateway: Success Confirmation
    Gateway-->>Admin: HTTP 200 OK (Tenant deprovisioned)
```

---

## 4. Summary Table of Microservices Involved

| Microservice | Port | Role in Organization Flow |
| :--- | :--- | :--- |
| **API Gateway** | `3000` | HTTP Entrypoint, Swagger Docs, `x-tenant-id` header extraction, request proxying. |
| **Auth Service** | `3001` | Password hashing, JWT token generation/validation, platform credentials management, OTP. |
| **Tenant Service**| `3002` | Automated PostgreSQL database creation (`CREATE DATABASE`), schema sync, DB config persistence, deprovisioning. |
| **User Service** | `3003` | Tenant-isolated user management, RBAC Roles & Permissions management per tenant DB. |

---

## 5. Verification & Testing

To test the full Organization Flow locally:

1. **Onboard Organization**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register-tenant \
     -H "Content-Type: application/json" \
     -d '{
       "companyName": "Acme Corp",
       "domain": "acme",
       "adminEmail": "admin@acme.com",
       "password": "Password123!",
       "firstName": "John",
       "lastName": "Doe"
     }'
   ```
2. **User Login**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@acme.com",
       "password": "Password123!"
     }'
   ```
3. **Execute Tenant-Isolated Request**:
   ```bash
   curl -X GET http://localhost:3000/api/v1/org/dashboard \
     -H "x-tenant-id: tenant-acme" \
     -H "Authorization: Bearer <your_jwt_token>"
   ```
