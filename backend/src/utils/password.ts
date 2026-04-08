import { Errors } from './errors.js';

// 密码强度校验：最少8位，大写、小写、数字、特殊字符
export function validatePasswordStrength(password: string): void {
  if (password.length < 8) {
    throw Errors.badRequest('密码至少 8 个字符');
  }
  if (!/[A-Z]/.test(password)) {
    throw Errors.badRequest('密码必须包含大写字母');
  }
  if (!/[a-z]/.test(password)) {
    throw Errors.badRequest('密码必须包含小写字母');
  }
  if (!/[0-9]/.test(password)) {
    throw Errors.badRequest('密码必须包含数字');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    throw Errors.badRequest('密码必须包含特殊字符');
  }
}
