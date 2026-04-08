'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// 密码强度规则检查
export function checkPasswordRules(password: string) {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };
}

// 计算强度等级：0-4
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  const rules = checkPasswordRules(password);
  const passed = Object.values(rules).filter(Boolean).length;
  return passed;
}

// 所有规则是否都通过
export function isPasswordStrong(password: string): boolean {
  return getPasswordStrength(password) === 5;
}

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { t } = useI18n();

  const rules = useMemo(() => checkPasswordRules(password), [password]);
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  // 强度标签和颜色
  const strengthConfig = [
    { label: '', color: '' },
    { label: t.pwd_weak, color: 'bg-red-500' },
    { label: t.pwd_weak, color: 'bg-red-500' },
    { label: t.pwd_medium, color: 'bg-yellow-500' },
    { label: t.pwd_strong, color: 'bg-blue-500' },
    { label: t.pwd_very_strong, color: 'bg-green-500' },
  ];

  const { label, color } = strengthConfig[strength] || strengthConfig[0];

  const ruleItems = [
    { key: 'minLength', passed: rules.minLength, label: t.pwd_rule_length },
    { key: 'hasUpper', passed: rules.hasUpper, label: t.pwd_rule_upper },
    { key: 'hasLower', passed: rules.hasLower, label: t.pwd_rule_lower },
    { key: 'hasNumber', passed: rules.hasNumber, label: t.pwd_rule_number },
    { key: 'hasSpecial', passed: rules.hasSpecial, label: t.pwd_rule_special },
  ];

  return (
    <div className="space-y-2">
      {/* 强度条 */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= strength ? color : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      </div>

      {/* 规则列表 */}
      <div className="grid grid-cols-1 gap-1">
        {ruleItems.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 text-xs">
            {item.passed ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={item.passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
