import { Resolver, Query, Args } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmployeeService } from '../employee/employee.service';
import { SocialService } from '../social/social.service';
import { SocialPageData } from './types/page.types';

// TS1272 workaround
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

@Resolver()
export class SocialPageResolver {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly socialService: SocialService,
  ) {}

  @Query(() => SocialPageData, { name: 'socialPage' })
  async getSocialPage(
    @CurrentUser() user: JwtPayload,
  ): Promise<SocialPageData> {
    const { companyId } = user;

    const [announcementsResult, kudosResult, employeesResult] = await Promise.all([
      this.socialService.findAnnouncements(companyId, 1, 20),
      this.socialService.getKudos(companyId, 1, 20),
      this.employeeService.findAll(companyId, { page: 1, limit: 500 }),
    ]);

    const announcements = (announcementsResult?.data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content ?? undefined,
      priority: a.priority ?? undefined,
      isPinned: a.isPinned ?? undefined,
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : undefined,
    }));

    const kudos = (kudosResult?.data || []).map((k: any) => ({
      id: k.id,
      message: k.message ?? undefined,
      category: k.category ?? undefined,
      senderName: k.sender ? `${k.sender.firstName} ${k.sender.lastName}` : k.senderName ?? undefined,
      recipientName: k.recipient ? `${k.recipient.firstName} ${k.recipient.lastName}` : k.recipientName ?? undefined,
      createdAt: k.createdAt ? new Date(k.createdAt).toISOString() : undefined,
    }));

    const employees = (employeesResult?.data || []).map((e: any) => ({
      id: e.id,
      employeeCode: e.employeeCode ?? undefined,
      firstName: e.firstName,
      lastName: e.lastName,
    }));

    return { announcements, kudos, employees };
  }
}
