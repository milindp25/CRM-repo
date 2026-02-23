import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { DashboardRepository } from './dashboard.repository';

// ─── Widget Registry ──────────────────────────────────────────────────────────

export interface WidgetDefinition {
  id: string;
  label: string;
  roles: string[];
  defaultSize: 'full' | 'half';
  category: string;
}

export interface WidgetLayout {
  widgetId: string;
  order: number;
  visible: boolean;
  size: 'full' | 'half';
}

const WIDGET_REGISTRY: WidgetDefinition[] = [
  { id: 'welcome', label: 'Welcome Message', roles: ['*'], defaultSize: 'full', category: 'general' },
  { id: 'stats_overview', label: 'Quick Stats', roles: ['COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER'], defaultSize: 'full', category: 'general' },
  { id: 'my_attendance', label: 'My Attendance', roles: ['*'], defaultSize: 'half', category: 'attendance' },
  { id: 'my_leaves', label: 'My Leaves', roles: ['*'], defaultSize: 'half', category: 'leave' },
  { id: 'my_payslip', label: 'Latest Payslip', roles: ['*'], defaultSize: 'half', category: 'payroll' },
  { id: 'pending_approvals', label: 'Pending Approvals', roles: ['COMPANY_ADMIN', 'HR_ADMIN', 'MANAGER'], defaultSize: 'half', category: 'workflow' },
  { id: 'team_attendance', label: 'Team Attendance', roles: ['MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'], defaultSize: 'half', category: 'attendance' },
  { id: 'team_leaves', label: 'Team Leave Calendar', roles: ['MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'], defaultSize: 'half', category: 'leave' },
  { id: 'calendar', label: 'Calendar', roles: ['*'], defaultSize: 'half', category: 'general' },
  { id: 'activity_feed', label: 'Activity Feed', roles: ['*'], defaultSize: 'half', category: 'general' },
  { id: 'org_chart', label: 'Org Chart', roles: ['*'], defaultSize: 'half', category: 'general' },
  { id: 'announcements', label: 'Announcements', roles: ['*'], defaultSize: 'half', category: 'social' },
  { id: 'kudos_feed', label: 'Kudos Feed', roles: ['*'], defaultSize: 'half', category: 'social' },
  { id: 'birthdays', label: 'Birthdays & Anniversaries', roles: ['*'], defaultSize: 'half', category: 'social' },
  { id: 'hr_analytics', label: 'HR Analytics Summary', roles: ['COMPANY_ADMIN', 'HR_ADMIN'], defaultSize: 'full', category: 'analytics' },
  { id: 'recruitment_pipeline', label: 'Recruitment Pipeline', roles: ['COMPANY_ADMIN', 'HR_ADMIN'], defaultSize: 'half', category: 'recruitment' },
];

@Injectable()
export class DashboardService {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get available widgets filtered by the user's role.
   * Widgets with roles=['*'] are available to all roles.
   */
  getAvailableWidgets(userRole: string): WidgetDefinition[] {
    return WIDGET_REGISTRY.filter(
      (widget) => widget.roles.includes('*') || widget.roles.includes(userRole),
    );
  }

  /**
   * Get the user's dashboard config.
   * If no saved config exists, returns a default layout for their role.
   */
  async getConfig(
    userId: string,
    userRole: string,
  ): Promise<{ layout: WidgetLayout[] }> {
    this.logger.log(`Fetching dashboard config for user ${userId}`);

    const config = await this.repository.findConfig(userId);

    if (config && config.layout) {
      return { layout: config.layout as unknown as WidgetLayout[] };
    }

    // Build default layout from registry based on user role
    const defaultLayout = this.buildDefaultLayout(userRole);
    return { layout: defaultLayout };
  }

  /**
   * Update (upsert) the user's dashboard config.
   */
  async updateConfig(
    userId: string,
    companyId: string,
    layout: WidgetLayout[],
  ): Promise<{ layout: WidgetLayout[] }> {
    this.logger.log(`Updating dashboard config for user ${userId}`);

    // Cast layout to `any` for Prisma JSON input
    const saved = await this.repository.upsertConfig(userId, companyId, layout as any);
    return { layout: saved.layout as unknown as WidgetLayout[] };
  }

  /**
   * Reset the user's dashboard config by deleting it.
   * The next call to getConfig will return defaults for their role.
   */
  async resetConfig(
    userId: string,
    companyId: string,
    userRole: string,
  ): Promise<{ layout: WidgetLayout[] }> {
    this.logger.log(`Resetting dashboard config for user ${userId}`);

    await this.repository.deleteConfig(userId);

    // Return the default layout immediately
    const defaultLayout = this.buildDefaultLayout(userRole);
    return { layout: defaultLayout };
  }

  /**
   * Build a default layout for a given role.
   * Filters the registry by role, then creates layout entries
   * with order=index, visible=true, and size from defaultSize.
   */
  private buildDefaultLayout(userRole: string): WidgetLayout[] {
    const availableWidgets = this.getAvailableWidgets(userRole);
    return availableWidgets.map((widget, index) => ({
      widgetId: widget.id,
      order: index,
      visible: true,
      size: widget.defaultSize,
    }));
  }
}
