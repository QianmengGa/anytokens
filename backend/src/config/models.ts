// 模型定价配置（单位：美元/百万 Token）
// 售价 = 上游成本 × 1.2（20% 溢价）

export interface ModelPricing {
  // 上游供应商 ID
  provider: 'siliconflow';
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
  // === DeepSeek 系列 ===
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

  // === Qwen 系列 ===
  'qwen2.5-72b': {
    provider: 'siliconflow',
    upstreamModel: 'Qwen/Qwen2.5-72B-Instruct',
    inputPrice: 0.84,
    outputPrice: 0.84,
  },

  // === Qwen 小模型 ===
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

  // === GLM 系列 ===
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
