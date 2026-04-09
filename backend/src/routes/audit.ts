import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { auditService } from '../services/audit.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

const auditRouter = Router();
auditRouter.use(authenticate as any);

// GET /audit/my — 当前用户的审计日志
auditRouter.get('/my', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { action, start, end, page, pageSize } = req.query;
    const result = await auditService.getUserLogs(req.user!.id, {
      action: action as string,
      startDate: start ? new Date(start as string) : undefined,
      endDate: end ? new Date(end as string) : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    return success(res, result);
  } catch (err) { next(err); }
});

// GET /audit/sla — SLA 监控统计（所有登录用户可看）
auditRouter.get('/sla', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await auditService.getSlaStats();
    return success(res, result);
  } catch (err) { next(err); }
});

// GET /audit/all — 管理员查看所有用户日志
auditRouter.get('/all', requireAdmin as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, action, start, end, page, pageSize } = req.query;
    const result = await auditService.getAllLogs({
      userId: userId as string,
      action: action as string,
      startDate: start ? new Date(start as string) : undefined,
      endDate: end ? new Date(end as string) : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
    return success(res, result);
  } catch (err) { next(err); }
});

// POST /audit/cleanup — 管理员手动清理过期日志
auditRouter.post('/cleanup', requireAdmin as any, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = await auditService.cleanup();
    return success(res, { deletedCount: count }, `已清理 ${count} 条过期日志`);
  } catch (err) { next(err); }
});

export default auditRouter;
