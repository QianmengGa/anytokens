import { config } from './index.js';

// 支持的供应商类型
export type Provider = 'siliconflow' | 'google' | 'groq';

// 供应商连接信息（baseUrl + apiKey）
export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
}

// 供应商路由表：根据 provider 获取对应的 baseUrl 和 apiKey
export function getProviderConfig(provider: Provider): ProviderConfig {
  switch (provider) {
    case 'siliconflow':
      return { baseUrl: config.siliconflowBaseUrl, apiKey: config.siliconflowApiKey };
    case 'google':
      return { baseUrl: config.googleBaseUrl, apiKey: config.googleApiKey };
    case 'groq':
      return { baseUrl: config.groqBaseUrl, apiKey: config.groqApiKey };
  }
}

// 模型定价配置（单位：美元/百万 Token）
export interface ModelPricing {
  // 上游供应商
  provider: Provider;
  // 上游模型 ID（发送给供应商的实际名称）
  upstreamModel: string;
  // 售价：输入 $/1M tokens
  inputPrice: number;
  // 售价：输出 $/1M tokens
  outputPrice: number;
  // 是否免费模型
  free?: boolean;
}

// 模型路由表：用户传入的模型名 → 供应商 + 定价
export const MODEL_MAP: Record<string, ModelPricing> = {

  // ══════════════════════════════════════════
  //  SiliconFlow 系列
  // ══════════════════════════════════════════

  // === DeepSeek ===
  'deepseek-v3': {
    provider: 'siliconflow',
    upstreamModel: 'deepseek-ai/DeepSeek-V3',
    inputPrice: 0.42,
    outputPrice: 1.68,
  },
  'deepseek-r1': {
    provider: 'siliconflow',
    upstreamModel: 'deepseek-ai/DeepSeek-R1',
    inputPrice: 0.66,
    outputPrice: 2.64,
  },

  // === Qwen ===
  'qwen2.5-72b': {
    provider: 'siliconflow',
    upstreamModel: 'Qwen/Qwen2.5-72B-Instruct',
    inputPrice: 0.84,
    outputPrice: 0.84,
  },
  'qwen2.5-7b': {
    provider: 'siliconflow',
    upstreamModel: 'Qwen/Qwen2.5-7B-Instruct',
    inputPrice: 0,
    outputPrice: 0,
    free: true,
  },
  'qwen3-8b': {
    provider: 'siliconflow',
    upstreamModel: 'Qwen/Qwen3-8B',
    inputPrice: 0,
    outputPrice: 0,
    free: true,
  },

  // === GLM ===
  'glm-4-9b': {
    provider: 'siliconflow',
    upstreamModel: 'THUDM/GLM-4-9B-0414',
    inputPrice: 0,
    outputPrice: 0,
    free: true,
  },

  // === DeepSeek 蒸馏 ===
  'deepseek-r1-7b': {
    provider: 'siliconflow',
    upstreamModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
    inputPrice: 0,
    outputPrice: 0,
    free: true,
  },

  // ══════════════════════════════════════════
  //  Google Gemini 系列
  // ══════════════════════════════════════════

  'gemini-1.5-pro': {
    provider: 'google',
    upstreamModel: 'gemini-1.5-pro',
    inputPrice: 1.25,
    outputPrice: 5.00,
  },
  'gemini-1.5-flash': {
    provider: 'google',
    upstreamModel: 'gemini-1.5-flash',
    inputPrice: 0,
    outputPrice: 0,
    free: true,
  },

  // ══════════════════════════════════════════
  //  Groq 系列
  // ══════════════════════════════════════════

  'llama3-70b': {
    provider: 'groq',
    upstreamModel: 'llama3-70b-8192',
    inputPrice: 0.59,
    outputPrice: 0.79,
  },
  'mixtral-8x7b': {
    provider: 'groq',
    upstreamModel: 'mixtral-8x7b-32768',
    inputPrice: 0.24,
    outputPrice: 0.24,
  },
};

// 根据模型名查找配置（支持大小写不敏感）
export function resolveModel(modelName: string): (ModelPricing & { displayName: string }) | null {
  // 精确匹配
  if (MODEL_MAP[modelName]) {
    return { ...MODEL_MAP[modelName], displayName: modelName };
  }
  // 大小写不敏感匹配
  const lower = modelName.toLowerCase();
  for (const [key, value] of Object.entries(MODEL_MAP)) {
    if (key.toLowerCase() === lower) {
      return { ...value, displayName: key };
    }
  }
  // 支持用户直接传上游模型名（如 deepseek-ai/DeepSeek-V3）
  for (const [key, value] of Object.entries(MODEL_MAP)) {
    if (value.upstreamModel === modelName || value.upstreamModel.toLowerCase() === lower) {
      return { ...value, displayName: key };
    }
  }
  return null;
}

// 计算费用（美元）
export function calculateCost(
  pricing: ModelPricing,
  inputTokens: number,
  outputTokens: number,
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPrice;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPrice;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}
