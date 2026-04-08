import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createKey, listKeys, deleteKey, getKeyUsage } from '../controllers/keys.controller.js';

const keysRouter = Router();

// 所有 Key 路由需要认证
keysRouter.use(authenticate as any);

// POST /keys — 创建新 Key
keysRouter.post('/', createKey as any);

// GET /keys — 列出用户所有 Key
keysRouter.get('/', listKeys as any);

// DELETE /keys/:id — 删除 Key
keysRouter.delete('/:id', deleteKey as any);

// GET /keys/:id/usage — 查看 Key 用量
keysRouter.get('/:id/usage', getKeyUsage as any);

export default keysRouter;
