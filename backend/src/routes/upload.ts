import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { success } from '../utils/response.js';
import { Errors } from '../utils/errors.js';
import type { AuthRequest } from '../types/index.js';

const uploadRouter = Router();

// 允许的 MIME 类型
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const PDF_TYPE = 'application/pdf';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PDF_SIZE = 20 * 1024 * 1024;   // 20MB

// multer 内存存储，不写磁盘
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_SIZE }, // 用最大的限制，后面按类型再检查
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES.has(file.mimetype) || file.mimetype === PDF_TYPE) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，仅支持 JPG/PNG/GIF/WEBP 图片和 PDF'));
    }
  },
});

// 需要登录
uploadRouter.use(authenticate as any);

// POST / — 上传文件
uploadRouter.post('/', upload.single('file'), (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      return next(Errors.badRequest('请上传文件（字段名: file）'));
    }

    const isImage = IMAGE_TYPES.has(file.mimetype);

    // 按类型检查大小
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return next(Errors.badRequest('图片大小不能超过 10MB'));
    }
    if (!isImage && file.size > MAX_PDF_SIZE) {
      return next(Errors.badRequest('PDF 大小不能超过 20MB'));
    }

    const base64 = file.buffer.toString('base64');

    return success(res, {
      type: isImage ? 'image' : 'pdf',
      mimeType: file.mimetype,
      base64,
      filename: file.originalname,
      size: file.size,
    });
  } catch (err) {
    next(err);
  }
});

export default uploadRouter;
