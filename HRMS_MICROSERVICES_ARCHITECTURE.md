# HRMS Microservices Architecture & Engineering Specification

> **Version**: 1.0.0 | **Pattern**: NestJS Monorepo Microservices | **Stack**: TypeScript, NestJS 11, Sequelize ORM, PostgreSQL

---

## 1. Executive Summary

This document specifies the **Microservices Architecture** for the multi-tenant HRMS Platform. Designed as a NestJS Monorepo, the platform decouples administrative HR operations from performance, work management, recruitment, and learning management to enable independent service scaling, strong tenant data security, and long-term ecosystem growth.

### Strategic Architectural Pillars
- **Strict Multi-Tenancy**: Organization context isolation (`tenantId`) is enforced at the API gateway layer and propagated asynchronously across backend microservices without context leakage.
- **Core Performance & Work Linkage (PRD Section 8.3)**: Direct relational linkage connecting `Project → Task → Employee Output → Goal/KPI → Performance Review`.
- **Talent Ecosystem Preparedness**: Candidate profiles exist independently of employer tenants, allowing candidates to reuse a single profile across multiple hiring companies in Phase 2.

---

## 2. High-Level System Architecture

```
                           ┌─────────────────────────┐
                           │   Web / Mobile App      │
                           └────────────┬────────────┘
                                        │ HTTP REST (Header: x-tenant-id)
                                        ▼
                           ┌─────────────────────────┐
                           │       API Gateway       │  (Port 3000 / Swagger UI)
                           └────────────┬────────────┘
                                        │ TCP Message Patterns
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌────────────────────┐       ┌────────────────────┐       ┌────────────────────┐
│    Auth Service    │       │  Org & Employee    │       │ Attendance & Leave │
│    (Port 3001)     │       │    (Port 3002)     │       │    (Port 3003)     │
└──────────┬─────────┘       └──────────┬─────────┘       └──────────┬─────────┘
           │                            │                            │
           └────────────────────────────┼────────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌────────────────────┐       ┌────────────────────┐       ┌────────────────────┐
│  Payroll Service   │       │ Performance & Work │       │Recruitment Service │
│    (Port 3004)     │       │    (Port 3005)     │       │    (Port 3006)     │
└──────────┬─────────┘       └──────────┬─────────┘       └──────────┬─────────┘
           │                            │                            │
           └────────────────────────────┼────────────────────────────┘
                                        │ TCP Message Patterns
                                        ▼
                             ┌────────────────────┐
                             │    LMS Service     │  (Port 3007)
                             └──────────┬─────────┘
                                        │
                                        ▼
                             ┌────────────────────┐
                             │ PostgreSQL Database│  (Sequelize TS Models)
                             └────────────────────┘
```

---

## 3. Microservice Registry & Domain Breakdown

| Service Name | Port | Transport | Primary Responsibilities | Core Entities Managed |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | `3000` | HTTP / REST | Request routing, JWT validation, TenantGuard context extraction, Swagger UI (`/api/docs`). | N/A (Gateway Proxy) |
| **Auth Service** | `3001` | TCP | Tenant registration, user login, password hashing, JWT generation, RBAC permission roles. | `Tenant`, `User`, `Role` |
| **Organization Service** | `3002` | TCP | Company departments, job designations, reporting manager lines, employee lifecycle master records. | `Department`, `Designation`, `EmployeeProfile` |
| **Attendance & Leave** | `3003` | TCP | Check-in/check-out tracking, working hours calculation, leave policies & approval workflows. | `Attendance`, `LeaveRequest` |
| **Payroll Service** | `3004` | TCP | Configurable salary structures, tax allowances, deductions, payslips, payroll run calculations. | `SalaryStructure`, `PayrollRecord` |
| **Performance & Work** | `3005` | TCP | Projects, tasks, work output logs, goals/KPIs, periodic performance reviews (**Core Differentiator**). | `Project`, `Task`, `EmployeeOutput`, `Goal`, `PerformanceReview` |
| **Recruitment Service**| `3006` | TCP | Job postings, candidate profiles, applicant pipeline tracking, candidate-to-employee conversion. | `CandidateProfile`, `JobPosting`, `JobApplication` |
| **LMS Service** | `3007` | TCP | Course catalogs, structured learning paths, employee training progress, internal certifications. | `Course`, `CourseEnrollment` |

---

## 4. Key Data Models & Inter-Service Relationships

All database models are implemented using `sequelize-typescript` decorators in the shared library `@app/database` ([`libs/database/src/index.ts`](file:///d:/futuura.com/hrms/hrms/src/database/models/index.ts)).

### 4.1 Work & Performance Relational Linkage (PRD Section 8.3)
Work data feeds directly into objective performance reviews:
- `Project`: Project container owned by a tenant.
- `Task`: Individual work assignment linked to a `Project` and assigned to an `EmployeeProfile`.
- `EmployeeOutput`: Output submission linked to completed `Task` and target `Goal` with a quality score.
- `Goal`: Quantifiable goal/KPI assigned to an employee.
- `PerformanceReview`: Structured review pulling accumulated factual output records.

### 4.2 Candidate Profile Model (Talent Marketplace Ready)
- `CandidateProfile`: Stores candidate `firstName`, `lastName`, `email`, `cvUrl`, and `skills[]`. Decoupled from `tenantId` to allow seamless multi-company applications in post-MVP phases.

---

## 5. API Gateway Specification & Endpoint Contracts

### 5.1 Onboard Organization (`POST /api/v1/auth/register-tenant`)
Registers a new tenant organization, provisions default Admin role, creates the initial User account, and sets up the primary Employee Profile.

**Request Body**:
```json
{
  "companyName": "Acme Corp",
  "domain": "acme",
  "adminEmail": "admin@acme.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created)**:
```json
{
  "message": "Tenant and Admin registered successfully",
  "tenantId": "c4b12f6a-04b3-4f8a-9892-9653d9e21183",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5.2 User Authentication (`POST /api/v1/auth/login`)
Authenticates user credentials against the Auth Microservice via TCP message patterns and issues signed JWT tokens.

---

## 6. Shared Monorepo Infrastructure (`libs/`)

```
libs/
├── common/                             # Shared utilities across all services
│   ├── tenant.guard.ts                 # Validates x-tenant-id & sets AsyncLocalStorage context
│   ├── user-tenant.decorator.ts        # @CurrentTenant() and @CurrentUser() param decorators
│   └── index.ts                        # SERVICES constants & TCP MESSAGE_PATTERNS
│
└── database/                           # Centralized data layer
    └── index.ts                        # Shared Sequelize TypeScript models (ALL_MODELS)
```

---

## 7. Operational Setup & Local Execution

### 7.1 Running Services Locally
```bash
# 1. Start Auth Microservice (TCP Port 3001)
npx nest start auth-service --watch

# 2. Start API Gateway (HTTP Port 3000)
npx nest start api-gateway --watch
```

### 7.2 Accessing OpenAPI Specs
- Navigate to `http://localhost:3000/api/docs` in your browser for interactive Swagger UI documentation.
