import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { teamService } from '../services/team.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

// Express 5 params 类型辅助
function param(req: AuthRequest, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : v;
}

const createSchema = z.object({ name: z.string().min(1).max(50) });
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});
const limitsSchema = z.object({
  maxPerDay: z.number().min(0.01).max(10000).nullable().optional(),
  maxPerMonth: z.number().min(0.01).max(100000).nullable().optional(),
});
const keySchema = z.object({ name: z.string().max(50).optional() });

// 创建团队
export async function createTeam(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name } = createSchema.parse(req.body);
    const result = await teamService.createTeam(req.user!.id, name);
    return success(res, result, '团队创建成功', 201);
  } catch (err) { next(err); }
}

// 列出我的团队
export async function listTeams(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teamService.listTeams(req.user!.id);
    return success(res, result);
  } catch (err) { next(err); }
}

// 获取团队详情
export async function getTeam(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teamService.getTeam(req.user!.id, param(req, 'teamId'));
    return success(res, result);
  } catch (err) { next(err); }
}

// 邀请成员
export async function inviteMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, role } = inviteSchema.parse(req.body);
    const result = await teamService.inviteMember(req.user!.id, param(req, 'teamId'), email, role);
    return success(res, result, '邀请已发送');
  } catch (err) { next(err); }
}

// 接受邀请
export async function acceptInvite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    if (!token) return success(res, null, '缺少 token');
    const result = await teamService.acceptInvite(req.user!.id, token);
    return success(res, result, '已加入团队');
  } catch (err) { next(err); }
}

// 移除成员
export async function removeMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teamService.removeMember(req.user!.id, param(req, 'teamId'), param(req, 'userId'));
    return success(res, result);
  } catch (err) { next(err); }
}

// 更新成员限额
export async function updateMemberLimits(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = limitsSchema.parse(req.body);
    const result = await teamService.updateMemberLimits(req.user!.id, param(req, 'teamId'), param(req, 'userId'), body);
    return success(res, result, '限额已更新');
  } catch (err) { next(err); }
}

// 创建团队 Key
export async function createTeamKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name } = keySchema.parse(req.body);
    const result = await teamService.createTeamKey(req.user!.id, param(req, 'teamId'), name || '');
    return success(res, result, 'API Key 创建成功', 201);
  } catch (err) { next(err); }
}

// 列出团队 Key
export async function listTeamKeys(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teamService.listTeamKeys(req.user!.id, param(req, 'teamId'));
    return success(res, result);
  } catch (err) { next(err); }
}

// 删除团队 Key
export async function deleteTeamKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teamService.deleteTeamKey(req.user!.id, param(req, 'teamId'), param(req, 'keyId'));
    return success(res, result);
  } catch (err) { next(err); }
}
