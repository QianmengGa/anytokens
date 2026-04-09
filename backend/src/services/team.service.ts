import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { emailService } from './email.service.js';
import { Errors } from '../utils/errors.js';

// 每个用户最多创建的团队数
const MAX_TEAMS_PER_USER = 3;
// 每个团队最多成员数
const MAX_MEMBERS_PER_TEAM = 20;
// 邀请有效期（7 天）
const INVITE_EXPIRE_DAYS = 7;

class TeamService {
  // 创建团队
  async createTeam(userId: string, name: string) {
    // 检查用户拥有的团队数
    const count = await prisma.teamMember.count({
      where: { userId, role: 'OWNER' },
    });
    if (count >= MAX_TEAMS_PER_USER) {
      throw Errors.badRequest(`最多创建 ${MAX_TEAMS_PER_USER} 个团队`);
    }

    const team = await prisma.$transaction(async (tx) => {
      const t = await tx.team.create({
        data: { name, ownerId: userId },
      });
      // 创建者自动成为 OWNER
      await tx.teamMember.create({
        data: { teamId: t.id, userId, role: 'OWNER' },
      });
      return t;
    });

    return team;
  }

  // 获取用户所属的所有团队
  async listTeams(userId: string) {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            _count: { select: { members: true, apiKeys: { where: { isActive: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      balance: m.team.balance.toString(),
      myRole: m.role,
      memberCount: m.team._count.members,
      apiKeyCount: m.team._count.apiKeys,
      createdAt: m.team.createdAt,
    }));
  }

  // 获取团队详情（含成员列表）
  async getTeam(userId: string, teamId: string) {
    // 验证用户是团队成员
    const membership = await this.requireMembership(userId, teamId);

    const team = await prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      include: {
        members: {
          include: {
            // 关联查询用户信息
          },
        },
      },
    });

    // 查询成员用户信息
    const memberUserIds = team.members.map((m) => m.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: memberUserIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 查询每个成员的当月消费
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // 获取团队所有 API Key 的 ID
    const teamKeyIds = await prisma.apiKey.findMany({
      where: { teamId, isActive: true },
      select: { id: true, userId: true },
    });

    // 按成员统计用量
    const memberStats = await prisma.usageLog.groupBy({
      by: ['userId'],
      where: {
        apiKeyId: { in: teamKeyIds.map((k) => k.id) },
        createdAt: { gte: monthStart },
        status: 'success',
      },
      _sum: { cost: true, totalTokens: true },
      _count: true,
    });
    const statsMap = new Map(memberStats.map((s) => [s.userId, s]));

    const members = team.members.map((m) => {
      const user = userMap.get(m.userId);
      const stats = statsMap.get(m.userId);
      return {
        id: m.id,
        userId: m.userId,
        name: user?.name || '',
        email: user?.email || '',
        role: m.role,
        maxPerDay: m.maxPerDay?.toString() || null,
        maxPerMonth: m.maxPerMonth?.toString() || null,
        monthCalls: stats?._count || 0,
        monthCost: (stats?._sum.cost ?? 0).toString(),
        monthTokens: stats?._sum.totalTokens || 0,
      };
    });

    return {
      id: team.id,
      name: team.name,
      balance: team.balance.toString(),
      myRole: membership.role,
      members,
    };
  }

  // 邀请成员
  async inviteMember(userId: string, teamId: string, email: string, role: 'ADMIN' | 'MEMBER') {
    const membership = await this.requireRole(userId, teamId, ['OWNER', 'ADMIN']);

    // ADMIN 不能邀请 ADMIN
    if (membership.role === 'ADMIN' && role === 'ADMIN') {
      throw Errors.forbidden('管理员无法邀请其他管理员');
    }

    // 检查成员数上限
    const count = await prisma.teamMember.count({ where: { teamId } });
    if (count >= MAX_MEMBERS_PER_TEAM) {
      throw Errors.badRequest(`团队最多 ${MAX_MEMBERS_PER_TEAM} 名成员`);
    }

    // 检查是否已是成员
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (targetUser) {
      const existing = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: targetUser.id } },
      });
      if (existing) {
        throw Errors.conflict('该用户已是团队成员');
      }
    }

    // 生成邀请令牌
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRE_DAYS * 24 * 60 * 60 * 1000);

    const invite = await prisma.teamInvite.create({
      data: { teamId, email, role, token, expiresAt },
    });

    // 异步发送团队邀请邮件
    const [inviter, team] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
      prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }),
    ]);
    emailService.sendTeamInvite(email, {
      teamName: team?.name || 'Team',
      inviterName: inviter?.name || inviter?.email || 'Someone',
      role,
      inviteToken: token,
    });

    return {
      inviteId: invite.id,
      token: invite.token,
      expiresAt: invite.expiresAt,
    };
  }

  // 接受邀请
  async acceptInvite(userId: string, token: string) {
    const invite = await prisma.teamInvite.findUnique({ where: { token } });
    if (!invite || invite.used || invite.expiresAt < new Date()) {
      throw Errors.badRequest('邀请链接无效或已过期');
    }

    // 确认邮箱匹配
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.email !== invite.email) {
      throw Errors.forbidden('邀请链接与当前账号不匹配');
    }

    // 检查是否已是成员
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: invite.teamId, userId } },
    });
    if (existing) {
      throw Errors.conflict('您已是该团队成员');
    }

    await prisma.$transaction(async (tx) => {
      await tx.teamInvite.update({ where: { id: invite.id }, data: { used: true } });
      await tx.teamMember.create({
        data: { teamId: invite.teamId, userId, role: invite.role },
      });
    });

    return { teamId: invite.teamId };
  }

  // 移除成员
  async removeMember(userId: string, teamId: string, targetUserId: string) {
    const membership = await this.requireRole(userId, teamId, ['OWNER', 'ADMIN']);
    const target = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });
    if (!target) throw Errors.notFound('成员不存在');

    // 不能移除 OWNER
    if (target.role === 'OWNER') throw Errors.forbidden('无法移除团队所有者');
    // ADMIN 不能移除 ADMIN
    if (membership.role === 'ADMIN' && target.role === 'ADMIN') {
      throw Errors.forbidden('管理员无法移除其他管理员');
    }

    await prisma.teamMember.delete({ where: { id: target.id } });
    return { message: '已移除' };
  }

  // 更新成员限额
  async updateMemberLimits(userId: string, teamId: string, targetUserId: string, limits: {
    maxPerDay?: number | null;
    maxPerMonth?: number | null;
  }) {
    await this.requireRole(userId, teamId, ['OWNER', 'ADMIN']);
    const target = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });
    if (!target) throw Errors.notFound('成员不存在');

    const updated = await prisma.teamMember.update({
      where: { id: target.id },
      data: {
        maxPerDay: limits.maxPerDay ?? null,
        maxPerMonth: limits.maxPerMonth ?? null,
      },
    });

    return {
      maxPerDay: updated.maxPerDay?.toString() || null,
      maxPerMonth: updated.maxPerMonth?.toString() || null,
    };
  }

  // 创建团队 API Key
  async createTeamKey(userId: string, teamId: string, name: string) {
    await this.requireRole(userId, teamId, ['OWNER', 'ADMIN']);

    const count = await prisma.apiKey.count({ where: { teamId, isActive: true } });
    if (count >= 20) throw Errors.badRequest('团队最多 20 个 API Key');

    const rawKey = 'sk-team-' + crypto.randomBytes(48).toString('base64url').slice(0, 48);
    const keyPrefix = rawKey.slice(0, 13);
    const bcrypt = await import('bcryptjs');
    const keyHash = await bcrypt.default.hash(rawKey, 10);

    const apiKey = await prisma.apiKey.create({
      data: { userId, teamId, name: name || 'Team Key', keyHash, keyPrefix },
      select: { id: true, name: true, keyPrefix: true, createdAt: true },
    });

    return { ...apiKey, key: rawKey };
  }

  // 列出团队 API Key
  async listTeamKeys(userId: string, teamId: string) {
    await this.requireMembership(userId, teamId);

    return prisma.apiKey.findMany({
      where: { teamId, isActive: true },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 删除团队 API Key
  async deleteTeamKey(userId: string, teamId: string, keyId: string) {
    await this.requireRole(userId, teamId, ['OWNER', 'ADMIN']);
    const key = await prisma.apiKey.findFirst({ where: { id: keyId, teamId, isActive: true } });
    if (!key) throw Errors.notFound('Key 不存在');
    await prisma.apiKey.update({ where: { id: keyId }, data: { isActive: false } });
    return { message: '已删除' };
  }

  // === 权限检查工具 ===

  private async requireMembership(userId: string, teamId: string) {
    const m = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!m) throw Errors.forbidden('您不是该团队成员');
    return m;
  }

  private async requireRole(userId: string, teamId: string, roles: string[]) {
    const m = await this.requireMembership(userId, teamId);
    if (!roles.includes(m.role)) {
      throw Errors.forbidden('权限不足');
    }
    return m;
  }
}

export const teamService = new TeamService();
