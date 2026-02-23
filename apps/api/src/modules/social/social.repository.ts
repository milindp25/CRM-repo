import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface DirectoryFilterParams {
  search?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}

export interface AnnouncementFilterParams {
  page?: number;
  limit?: number;
}

export interface KudosFilterParams {
  page?: number;
  limit?: number;
}

@Injectable()
export class SocialRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Directory ────────────────────────────────────────────────────────

  async findEmployees(companyId: string, filter: DirectoryFilterParams) {
    const { search, departmentId, page = 1, limit = 20 } = filter;

    const where: Prisma.EmployeeWhereInput = {
      companyId,
      isActive: true,
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { workEmail: { contains: search, mode: 'insensitive' } },
          { employeeCode: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(departmentId && { departmentId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { firstName: 'asc' },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          designation: {
            select: {
              id: true,
              title: true,
              level: true,
            },
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total };
  }

  async findBirthdays(companyId: string) {
    const now = new Date();
    const month = now.getMonth() + 1; // JS months are 0-indexed
    const day = now.getDate();

    const employees = await this.prisma.$queryRaw<
      Array<{
        id: string;
        first_name: string;
        last_name: string;
        work_email: string;
        employee_code: string;
        date_of_birth: Date;
        department_id: string | null;
      }>
    >`
      SELECT e.id, e.first_name, e.last_name, e.work_email, e.employee_code,
             e.date_of_birth, e.department_id
      FROM employees e
      WHERE e.company_id = ${companyId}::uuid
        AND EXTRACT(MONTH FROM e.date_of_birth) = ${month}
        AND EXTRACT(DAY FROM e.date_of_birth) = ${day}
        AND e.is_active = true
        AND e.deleted_at IS NULL
      ORDER BY e.first_name ASC
    `;

    return employees.map((e) => ({
      id: e.id,
      firstName: e.first_name,
      lastName: e.last_name,
      workEmail: e.work_email,
      employeeCode: e.employee_code,
      dateOfBirth: e.date_of_birth,
      departmentId: e.department_id,
    }));
  }

  async findAnniversaries(companyId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const employees = await this.prisma.$queryRaw<
      Array<{
        id: string;
        first_name: string;
        last_name: string;
        work_email: string;
        employee_code: string;
        date_of_joining: Date;
        department_id: string | null;
      }>
    >`
      SELECT e.id, e.first_name, e.last_name, e.work_email, e.employee_code,
             e.date_of_joining, e.department_id
      FROM employees e
      WHERE e.company_id = ${companyId}::uuid
        AND EXTRACT(MONTH FROM e.date_of_joining) = ${month}
        AND EXTRACT(DAY FROM e.date_of_joining) = ${day}
        AND e.is_active = true
        AND e.deleted_at IS NULL
      ORDER BY e.date_of_joining ASC
    `;

    return employees.map((e) => ({
      id: e.id,
      firstName: e.first_name,
      lastName: e.last_name,
      workEmail: e.work_email,
      employeeCode: e.employee_code,
      dateOfJoining: e.date_of_joining,
      departmentId: e.department_id,
      yearsOfService: now.getFullYear() - new Date(e.date_of_joining).getFullYear(),
    }));
  }

  // ─── Announcements ───────────────────────────────────────────────────

  async createAnnouncement(data: Prisma.AnnouncementCreateInput) {
    return this.prisma.announcement.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAnnouncements(companyId: string, filter: AnnouncementFilterParams) {
    const { page = 1, limit = 20 } = filter;

    const where: Prisma.AnnouncementWhereInput = {
      companyId,
      isActive: true,
    };

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return { data, total };
  }

  async findAnnouncementById(id: string, companyId: string) {
    return this.prisma.announcement.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateAnnouncement(
    id: string,
    companyId: string,
    data: Prisma.AnnouncementUpdateInput,
  ) {
    return this.prisma.announcement.update({
      where: {
        id,
        companyId,
      },
      data,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteAnnouncement(id: string, companyId: string) {
    return this.prisma.announcement.update({
      where: {
        id,
        companyId,
      },
      data: {
        isActive: false,
      },
    });
  }

  // ─── Kudos ────────────────────────────────────────────────────────────

  async createKudos(data: Prisma.KudosCreateInput) {
    return this.prisma.kudos.create({
      data,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            employeeCode: true,
          },
        },
      },
    });
  }

  async findKudos(companyId: string, filter: KudosFilterParams) {
    const { page = 1, limit = 20 } = filter;

    const where: Prisma.KudosWhereInput = {
      companyId,
      isPublic: true,
    };

    const [data, total] = await Promise.all([
      this.prisma.kudos.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              workEmail: true,
              employeeCode: true,
            },
          },
        },
      }),
      this.prisma.kudos.count({ where }),
    ]);

    return { data, total };
  }

  async findKudosByRecipient(employeeId: string, filter: KudosFilterParams) {
    const { page = 1, limit = 20 } = filter;

    const where: Prisma.KudosWhereInput = {
      recipientEmployeeId: employeeId,
    };

    const [data, total] = await Promise.all([
      this.prisma.kudos.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              workEmail: true,
              employeeCode: true,
            },
          },
        },
      }),
      this.prisma.kudos.count({ where }),
    ]);

    return { data, total };
  }

  async findKudosLeaderboard(companyId: string) {
    const leaderboard = await this.prisma.kudos.groupBy({
      by: ['recipientEmployeeId'],
      where: { companyId },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Fetch employee details for top recipients
    const employeeIds = leaderboard.map((entry) => entry.recipientEmployeeId);

    const employees = await this.prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        workEmail: true,
        employeeCode: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    return leaderboard.map((entry) => ({
      employee: employeeMap.get(entry.recipientEmployeeId) || null,
      kudosCount: entry._count.id,
    }));
  }

  // ─── Audit Log ────────────────────────────────────────────────────────

  async createAuditLog(data: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }
}
