import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { keysService } from '../services/keys.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

// 创建 Key 参数校验
const createKeySchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称最长 50 字符').optional(),
});

// 创建新 API Key
export async function createKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = createKeySchema.parse(req.body);
    const result = await keysService.createKey(req.user!.id, body.name || 'Default Key');
    return success(res, result, 'API Key 创建成功', 201);
  } catch (err) {
    next(err);
  }
}

// 列出用户所有 Key
export async function listKeys(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const keys = await keysService.listKeys(req.user!.id);
    return success(res, keys);
  } catch (err) {
    next(err);
  }
}

// 删除 Key
export async function deleteKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await keysService.deleteKey(req.user!.id, id);
    return success(res, result, '已删除');
  } catch (err) {
    next(err);
  }
}

// 查看单个 Key 用量
export async function getKeyUsage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await keysService.getKeyUsage(req.user!.id, id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}
