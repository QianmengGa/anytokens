import { config } from './index.js';

// 支持的供应商类型
export type Provider = 'siliconflow' | 'google' | 'groq';

// 路由策略
export type RoutingStrategy = 'price' | 'speed' | 'quality';

// 供应商连接信息
export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
}

// 供应商路由表
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

// 单个供应商选项
export interface ProviderOption {
  provider: Provider;
  upstreamModel: string;
  inputPrice: number;
  outputPrice: number;
  free?: boolean;
  // 质量评分（1-10，人工标注）
  qualityScore: number;
}

// 模型配置（支持多供应商）
export interface ModelConfig {
  providers: ProviderOption[];
}

// 兼容旧接口的类型（单个供应商选中后的结果）
export type ModelPricing = ProviderOption;

// ══════════════════════════════════════════════════════
//  模型路由表：每个模型可有多个供应商，按优先级排列
// ══════════════════════════════════════════════════════

export const MODEL_MAP: Record<string, ModelConfig> = {

  // === DeepSeek ===
  'deepseek-v3': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-V3', inputPrice: 0.42, outputPrice: 1.68, qualityScore: 9 },
    ],
  },
  'deepseek-r1': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-R1', inputPrice: 0.66, outputPrice: 2.64, qualityScore: 9 },
    ],
  },

  // === Qwen ===
  'qwen2.5-72b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen2.5-72B-Instruct', inputPrice: 0.84, outputPrice: 0.84, qualityScore: 8 },
    ],
  },
  'qwen2.5-7b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen2.5-7B-Instruct', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 6 },
    ],
  },
  'qwen3-8b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-8B', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 7 },
    ],
  },

  // === GLM ===
  'glm-4-9b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'THUDM/GLM-4-9B-0414', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 6 },
    ],
  },

  // === DeepSeek 蒸馏 ===
  'deepseek-r1-7b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 6 },
    ],
  },

  // === Gemini ===
  'gemini-1.5-pro': {
    providers: [
      { provider: 'google', upstreamModel: 'gemini-1.5-pro', inputPrice: 1.25, outputPrice: 5.00, qualityScore: 9 },
    ],
  },
  'gemini-1.5-flash': {
    providers: [
      { provider: 'google', upstreamModel: 'gemini-1.5-flash', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 7 },
    ],
  },

  // === Llama3 70B（Groq 快 + SiliconFlow 备用）===
  'llama3-70b': {
    providers: [
      { provider: 'groq', upstreamModel: 'llama3-70b-8192', inputPrice: 0.59, outputPrice: 0.79, qualityScore: 8 },
      { provider: 'siliconflow', upstreamModel: 'meta-llama/Meta-Llama-3-70B-Instruct', inputPrice: 0.84, outputPrice: 0.84, qualityScore: 8 },
    ],
  },

  // === Mixtral（Groq 快 + SiliconFlow 备用）===
  'mixtral-8x7b': {
    providers: [
      { provider: 'groq', upstreamModel: 'mixtral-8x7b-32768', inputPrice: 0.24, outputPrice: 0.24, qualityScore: 7 },
      { provider: 'siliconflow', upstreamModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1', inputPrice: 0.42, outputPrice: 0.42, qualityScore: 7 },
    ],
  },
};

// 根据模型名查找配置（返回完整的 ModelConfig）
export function resolveModelConfig(modelName: string): { config: ModelConfig; displayName: string } | null {
  // 精确匹配
  if (MODEL_MAP[modelName]) {
    return { config: MODEL_MAP[modelName], displayName: modelName };
  }
  // 大小写不敏感
  const lower = modelName.toLowerCase();
  for (const [key, value] of Object.entries(MODEL_MAP)) {
    if (key.toLowerCase() === lower) {
      return { config: value, displayName: key };
    }
  }
  // 支持上游模型名
  for (const [key, value] of Object.entries(MODEL_MAP)) {
    for (const p of value.providers) {
      if (p.upstreamModel === modelName || p.upstreamModel.toLowerCase() === lower) {
        return { config: value, displayName: key };
      }
    }
  }
  return null;
}

// 兼容旧接口：返回默认（第一个）供应商
export function resolveModel(modelName: string): (ModelPricing & { displayName: string }) | null {
  const result = resolveModelConfig(modelName);
  if (!result) return null;
  return { ...result.config.providers[0], displayName: result.displayName };
}

// 计算费用（美元）
export function calculateCost(
  pricing: ProviderOption,
  inputTokens: number,
  outputTokens: number,
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPrice;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPrice;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}
