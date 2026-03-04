import { Resolver, Query, Args } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SocialService } from '../social/social.service';
import { DirectoryPageData } from './types/page.types';

// TS1272 workaround
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

@Resolver()
export class DirectoryResolver {
  constructor(
    private readonly socialService: SocialService,
  ) {}

  @Query(() => DirectoryPageData, { name: 'directoryPage' })
  async getDirectoryPage(
    @Args({ name: 'search', type: () => String, nullable: true }) search: string | null,
    @CurrentUser() user: JwtPayload,
  ): Promise<DirectoryPageData> {
    const { companyId } = user;

    const [directoryResult, birthdayList, anniversaryList] = await Promise.all([
      this.socialService.searchDirectory(companyId, {
        search: search ?? undefined,
        page: 1,
        limit: 100,
      }),
      this.socialService.getBirthdays(companyId),
      this.socialService.getAnniversaries(companyId),
    ]);

    const mapEmployee = (e: any) => ({
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      workEmail: e.workEmail ?? undefined,
      workPhone: e.workPhone ?? undefined,
      department: e.department?.name ?? e.departmentName ?? undefined,
      designation: e.designation?.name ?? e.designationName ?? undefined,
      dateOfJoining: e.dateOfJoining ? (typeof e.dateOfJoining === 'string' ? e.dateOfJoining : e.dateOfJoining.toISOString().split('T')[0]) : undefined,
      dateOfBirth: e.dateOfBirth ? (typeof e.dateOfBirth === 'string' ? e.dateOfBirth : e.dateOfBirth.toISOString().split('T')[0]) : undefined,
      profilePhotoUrl: e.photoUrl ?? e.profilePhotoUrl ?? undefined,
    });

    return {
      employees: (directoryResult?.data || []).map(mapEmployee),
      birthdays: (birthdayList || []).map(mapEmployee),
      anniversaries: (anniversaryList || []).map(mapEmployee),
    };
  }
}
