import { Controller, Get, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { HRMSModuleKey, ModuleAction } from '@app/common';
import {
  TenantGuard,
  RolesGuard,
  PermissionsGuard,
  OrganizationModuleGuard,
  RequireModule,
} from '@app/tenant-context';

@ApiTags('Organization Modules')
@Controller('org')
@ApiBearerAuth()
@UseGuards(TenantGuard, RolesGuard, PermissionsGuard, OrganizationModuleGuard)
@ApiHeader({ name: 'x-tenant-id', description: 'Target Organization Tenant ID', required: true })
export class OrganizationModulesController {

  @Get('dashboard')
  @RequireModule(HRMSModuleKey.DASHBOARD)
  @ApiOperation({ summary: 'Main Dashboard stats & metrics' })
  getDashboard(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      totalEmployees: 42,
      activeProjects: 8,
      pendingLeaves: 3,
      monthlyPayroll: 125000.00,
      recentAnnouncements: [
        { id: '1', title: 'Q3 All Hands Meeting', category: 'Events' },
      ],
    };
  }

  @Get('geofence/locations')
  @RequireModule(HRMSModuleKey.ATTENDANCE)
  @ApiOperation({ summary: 'Geofencing Attendance boundaries' })
  getGeofenceLocations(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      locations: [
        { id: 'geo-1', name: 'HQ Office', latitude: 37.7749, longitude: -122.4194, radiusMeters: 100 },
      ],
    };
  }

  @Post('pos/transactions')
  @RequireModule(HRMSModuleKey.PAYROLL, ModuleAction.CREATE)
  @ApiOperation({ summary: 'Record Point of Sale (POS) transaction' })
  createPOSTransaction(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return {
      tenantId,
      status: 'completed',
      transactionId: 'pos-tx-1001',
      totalAmount: body?.totalAmount || 49.99,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('announcements')
  @RequireModule(HRMSModuleKey.SETTINGS)
  @ApiOperation({ summary: 'Notice board and announcements' })
  getAnnouncements(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      announcements: [
        { id: 'ann-1', title: 'Annual Health Checkup Drive', category: 'HR' },
      ],
    };
  }

  @Get('surveys')
  @RequireModule(HRMSModuleKey.PERFORMANCE)
  @ApiOperation({ summary: 'Employee surveys and feedback' })
  getSurveys(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      surveys: [
        { id: 'surv-1', title: 'Q3 Employee Satisfaction Survey', status: 'active' },
      ],
    };
  }

  @Get('web3/nft-rewards')
  @RequireModule(HRMSModuleKey.PERFORMANCE)
  @ApiOperation({ summary: 'NFT & Web3 HR Achievement Badges' })
  getNFTRewards(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      rewards: [
        { id: 'nft-1', badgeTitle: 'Innovator of the Month', tokenId: '7721', chain: 'Ethereum' },
      ],
    };
  }

  @Get('community/posts')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT)
  @ApiOperation({ summary: 'HR Community discussions' })
  getCommunityPosts(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      posts: [
        { id: 'post-1', title: 'Tips for Work-Life Balance', author: 'Jane Doe' },
      ],
    };
  }

  @Get('penalties')
  @RequireModule(HRMSModuleKey.ATTENDANCE)
  @ApiOperation({ summary: 'Interactive communication penalties log' })
  getPenalties(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      penalties: [
        { id: 'pen-1', reason: 'Unannounced Absence', amount: 50.00, status: 'resolved' },
      ],
    };
  }

  @Get('assets')
  @RequireModule(HRMSModuleKey.ASSETS)
  @ApiOperation({ summary: 'Asset Management list' })
  getAssets(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      assets: [
        { id: 'ast-1', name: 'MacBook Pro 16"', tag: 'AST-2026-01', status: 'assigned' },
      ],
    };
  }

  @Get('expenses')
  @RequireModule(HRMSModuleKey.EXPENSES)
  @ApiOperation({ summary: 'Expense claims & approvals' })
  getExpenses(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      claims: [
        { id: 'exp-1', category: 'Travel', amount: 350.00, status: 'submitted' },
      ],
    };
  }

  @Get('tickets')
  @RequireModule(HRMSModuleKey.TICKETS)
  @ApiOperation({ summary: 'Helpdesk & Ticket Management' })
  getTickets(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      tickets: [
        { id: 'tkt-1', subject: 'VPN Access issue', status: 'open' },
      ],
    };
  }

  @Get('audit-logs')
  @RequireModule(HRMSModuleKey.REPORTS)
  @ApiOperation({ summary: 'Audit trail and system activity logs' })
  getAuditLogs(@Headers('x-tenant-id') tenantId: string) {
    return {
      tenantId,
      logs: [
        { id: 'log-1', action: 'ROLE_UPDATE', performedBy: 'Admin', timestamp: new Date().toISOString() },
      ],
    };
  }
}
