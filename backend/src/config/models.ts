import { config } from './index.js';

// 支持的供应商类型
export type Provider = 'siliconflow' | 'google' | 'groq' | 'openai' | 'azure';

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
    case 'openai':
      return { baseUrl: config.openaiBaseUrl, apiKey: config.openaiApiKey };
    case 'azure':
      return { baseUrl: `${config.azureEndpoint}/openai/v1`, apiKey: config.azureApiKey };
  }
}

// ══════════════════════════════════════════════════════
//  非 Chat 模型定价（Embeddings / Images / TTS）
// ══════════════════════════════════════════════════════

export interface ExtraModelPricing {
  provider: Provider;
  upstreamModel: string;
  // 计费单位和单价
  billingUnit: 'token' | 'image' | 'character';
  pricePerUnit: number; // 每单位美元价格
}

export const EMBEDDING_MODELS: Record<string, ExtraModelPricing> = {
  'text-embedding-3-small': {
    provider: 'siliconflow', upstreamModel: 'BAAI/bge-m3',
    billingUnit: 'token', pricePerUnit: 0, // SiliconFlow 免费
  },
  'text-embedding-3-large': {
    provider: 'siliconflow', upstreamModel: 'BAAI/bge-large-zh-v1.5',
    billingUnit: 'token', pricePerUnit: 0, // SiliconFlow 免费
  },
};

export const IMAGE_MODELS: Record<string, ExtraModelPricing> = {
  'dall-e-3': {
    provider: 'siliconflow', upstreamModel: 'black-forest-labs/FLUX.1-schnell',
    billingUnit: 'image', pricePerUnit: 0, // SiliconFlow 免费
  },
  'dall-e-3-hd': {
    provider: 'siliconflow', upstreamModel: 'black-forest-labs/FLUX.1-dev',
    billingUnit: 'image', pricePerUnit: 0.035, // $0.035/张
  },
};

export const TTS_MODELS: Record<string, ExtraModelPricing> = {
  'tts-1': {
    provider: 'siliconflow', upstreamModel: 'fishaudio/fish-speech-1.5',
    billingUnit: 'character', pricePerUnit: 0, // SiliconFlow 免费
  },
};

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
  supportsVision?: boolean;  // 支持图片输入
  supportsPdf?: boolean;     // 支持 PDF 输入
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
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-V3', inputPrice: 0.27, outputPrice: 1.10, qualityScore: 9 },
      { provider: 'azure', upstreamModel: 'DeepSeek-V3-0324', inputPrice: 0.27, outputPrice: 1.10, qualityScore: 9 },
    ],
  },
  'deepseek-r1': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-R1', inputPrice: 0.55, outputPrice: 2.20, qualityScore: 9 },
      { provider: 'azure', upstreamModel: 'DeepSeek-R1', inputPrice: 0.55, outputPrice: 2.19, qualityScore: 9 },
    ],
  },

  // === Qwen ===
  'qwen2.5-72b': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen2.5-72B-Instruct', inputPrice: 0.567, outputPrice: 0.567, qualityScore: 8 },
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

  // === Qwen Coder ===
  'qwen2.5-coder-32b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen2.5-Coder-32B-Instruct', inputPrice: 0.173, outputPrice: 0.173, qualityScore: 8 },
    ],
  },
  'qwen3-32b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-32B', inputPrice: 0.137, outputPrice: 0.549, qualityScore: 8 },
    ],
  },

  // === Llama ===
  'llama-3.3-70b': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'meta-llama/Llama-3.3-70B-Instruct', inputPrice: 0.096, outputPrice: 0.275, qualityScore: 8 },
      { provider: 'azure', upstreamModel: 'Llama-3.3-70B-Instruct', inputPrice: 0.59, outputPrice: 0.79, qualityScore: 9 },
    ],
  },
  'llama-3.1-8b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 6 },
    ],
  },

  // === Yi ===
  'yi-lightning': {
    providers: [
      { provider: 'siliconflow', upstreamModel: '01-ai/Yi-Lightning', inputPrice: 0.99, outputPrice: 0.99, qualityScore: 7 },
    ],
  },

  // === Mistral ===
  'mistral-7b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'mistralai/Mistral-7B-Instruct-v0.3', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 6 },
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
    supportsVision: true,
    supportsPdf: true,
    providers: [
      { provider: 'google', upstreamModel: 'gemini-1.5-pro', inputPrice: 1.25, outputPrice: 5.00, qualityScore: 9 },
    ],
  },
  'gemini-1.5-flash': {
    supportsVision: true,
    supportsPdf: true,
    providers: [
      { provider: 'google', upstreamModel: 'gemini-1.5-flash', inputPrice: 0.075, outputPrice: 1.20, qualityScore: 7 },
    ],
  },

  // === Llama3 70B（Groq 快 + SiliconFlow 备用）===
  'llama3-70b': {
    providers: [
      { provider: 'groq', upstreamModel: 'llama3-70b-8192', inputPrice: 0.71, outputPrice: 0.95, qualityScore: 8 }, // Groq 原价 $0.59/$0.79 + 20% 加价
      { provider: 'siliconflow', upstreamModel: 'meta-llama/Meta-Llama-3-70B-Instruct', inputPrice: 0.84, outputPrice: 0.84, qualityScore: 8 },
    ],
  },

  // === Mixtral（Groq 快 + SiliconFlow 备用）===
  'mixtral-8x7b': {
    providers: [
      { provider: 'groq', upstreamModel: 'mixtral-8x7b-32768', inputPrice: 0.29, outputPrice: 0.29, qualityScore: 7 }, // Groq 原价 $0.24/$0.24 + 20% 加价
      { provider: 'siliconflow', upstreamModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1', inputPrice: 0.42, outputPrice: 0.42, qualityScore: 7 },
    ],
  },

  // === Qwen3 235B（旗舰大模型）===
  'qwen3-235b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-235B-A22B-Instruct-2507', inputPrice: 0.344, outputPrice: 1.374, qualityScore: 10 },
    ],
  },

  // === DeepSeek V3.1 ===
  'deepseek-v3.1': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-V3.1-Terminus', inputPrice: 0.55, outputPrice: 1.65, qualityScore: 10 },
    ],
  },

  // === Qwen2.5 VL 32B（视觉多模态）===
  'qwen2.5-vl-32b': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen2.5-VL-32B-Instruct', inputPrice: 0.260, outputPrice: 0.260, qualityScore: 8 },
    ],
  },

  // ══════════════════════════════════════════════════════
  //  新增模型 — 2026-04-11 批量扩充
  // ══════════════════════════════════════════════════════

  // === DeepSeek V3.2（最新旗舰）===
  'deepseek-v3.2': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-V3.2', inputPrice: 0.27, outputPrice: 0.41, qualityScore: 10 },
    ],
  },
  // === DeepSeek V2.5 ===
  'deepseek-v2.5': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-V2.5', inputPrice: 0.183, outputPrice: 0.183, qualityScore: 7 },
    ],
  },
  // === DeepSeek R1 蒸馏 14B / 32B ===
  'deepseek-r1-14b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B', inputPrice: 0.096, outputPrice: 0.096, qualityScore: 7 },
    ],
  },
  'deepseek-r1-32b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', inputPrice: 0.173, outputPrice: 0.173, qualityScore: 8 },
    ],
  },
  // === DeepSeek R1 0528（Qwen3-8B 蒸馏）===
  'deepseek-r1-0528-8b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 7 },
    ],
  },

  // === Qwen3.5 系列（最新一代）===
  'qwen3.5-397b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3.5-397B-A17B', inputPrice: 3.50, outputPrice: 14.00, qualityScore: 10 },
    ],
  },
  'qwen3.5-122b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3.5-122B-A10B', inputPrice: 1.50, outputPrice: 6.00, qualityScore: 9 },
    ],
  },
  'qwen3.5-35b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3.5-35B-A3B', inputPrice: 0.35, outputPrice: 1.40, qualityScore: 8 },
    ],
  },
  'qwen3.5-27b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3.5-27B', inputPrice: 0.50, outputPrice: 2.00, qualityScore: 8 },
    ],
  },
  'qwen3.5-9b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3.5-9B', inputPrice: 0.206, outputPrice: 1.648, qualityScore: 7 },
    ],
  },
  'qwen3.5-4b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3.5-4B', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 6 },
    ],
  },

  // === Qwen3 补充 ===
  'qwen3-14b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-14B', inputPrice: 0.069, outputPrice: 0.275, qualityScore: 7 },
    ],
  },
  'qwen3-30b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-30B-A3B-Instruct-2507', inputPrice: 0.096, outputPrice: 0.385, qualityScore: 8 },
    ],
  },
  'qwen3-235b-thinking': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-235B-A22B-Thinking-2507', inputPrice: 0.344, outputPrice: 1.374, qualityScore: 10 },
    ],
  },

  // === QwQ（推理模型）===
  'qwq-32b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/QwQ-32B', inputPrice: 0.137, outputPrice: 0.549, qualityScore: 8 },
    ],
  },

  // === Qwen2.5 补充 ===
  'qwen2.5-14b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen2.5-14B-Instruct', inputPrice: 0.096, outputPrice: 0.096, qualityScore: 7 },
    ],
  },
  'qwen2.5-32b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen2.5-32B-Instruct', inputPrice: 0.173, outputPrice: 0.173, qualityScore: 8 },
    ],
  },
  'qwen2.5-72b-128k': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen2.5-72B-Instruct-128K', inputPrice: 0.567, outputPrice: 0.567, qualityScore: 8 },
    ],
  },
  'qwen2.5-vl-72b': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen2.5-VL-72B-Instruct', inputPrice: 0.567, outputPrice: 0.567, qualityScore: 9 },
    ],
  },

  // === Qwen3 视觉多模态 ===
  'qwen3-vl-8b': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-VL-8B-Instruct', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 7 },
    ],
  },
  'qwen3-vl-32b': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-VL-32B-Instruct', inputPrice: 0.137, outputPrice: 0.549, qualityScore: 8 },
    ],
  },
  'qwen3-vl-30b': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-VL-30B-A3B-Instruct', inputPrice: 0.096, outputPrice: 0.385, qualityScore: 8 },
    ],
  },
  'qwen3-vl-235b': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-VL-235B-A22B-Instruct', inputPrice: 0.344, outputPrice: 1.374, qualityScore: 10 },
    ],
  },

  // === Qwen3 Coder ===
  'qwen3-coder-30b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-Coder-30B-A3B-Instruct', inputPrice: 0.096, outputPrice: 0.385, qualityScore: 8 },
    ],
  },
  'qwen3-coder-480b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen3-Coder-480B-A35B-Instruct', inputPrice: 1.099, outputPrice: 2.198, qualityScore: 10 },
    ],
  },

  // === GLM 系列（智谱清言）===
  'glm-5.1': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'zai-org/GLM-5.1', inputPrice: 0.824, outputPrice: 3.846, qualityScore: 9 },
    ],
  },
  'glm-5': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'zai-org/GLM-5', inputPrice: 0.549, outputPrice: 3.022, qualityScore: 9 },
    ],
  },
  'glm-4.7': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'zai-org/GLM-4.7', inputPrice: 0.549, outputPrice: 2.198, qualityScore: 8 },
    ],
  },
  'glm-4.6': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'zai-org/GLM-4.6', inputPrice: 0.481, outputPrice: 1.923, qualityScore: 8 },
    ],
  },
  'glm-4.6v': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'zai-org/GLM-4.6V', inputPrice: 0.137, outputPrice: 0.412, qualityScore: 8 },
    ],
  },
  'glm-4.5v': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'zai-org/GLM-4.5V', inputPrice: 0.137, outputPrice: 0.824, qualityScore: 7 },
    ],
  },
  'glm-4.5-air': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'zai-org/GLM-4.5-Air', inputPrice: 0.137, outputPrice: 0.824, qualityScore: 7 },
    ],
  },
  'glm-4-32b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'THUDM/GLM-4-32B-0414', inputPrice: 0.260, outputPrice: 0.260, qualityScore: 8 },
    ],
  },
  'glm-z1-32b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'THUDM/GLM-Z1-32B-0414', inputPrice: 0.137, outputPrice: 0.549, qualityScore: 8 },
    ],
  },
  'glm-z1-9b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'THUDM/GLM-Z1-9B-0414', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 6 },
    ],
  },

  // === Kimi / Moonshot ===
  'kimi-k2.5': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'moonshotai/Kimi-K2.5', inputPrice: 0.549, outputPrice: 2.885, qualityScore: 9 },
    ],
  },
  'kimi-k2-thinking': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'moonshotai/Kimi-K2-Thinking', inputPrice: 0.549, outputPrice: 2.198, qualityScore: 9 },
    ],
  },
  'kimi-k2': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'moonshotai/Kimi-K2-Instruct-0905', inputPrice: 0.549, outputPrice: 2.198, qualityScore: 9 },
    ],
  },

  // === MiniMax ===
  'minimax-m2.5': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'MiniMaxAI/MiniMax-M2.5', inputPrice: 0.288, outputPrice: 1.154, qualityScore: 9 },
    ],
  },

  // === Step（阶跃星辰）===
  'step-3.5-flash': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'stepfun-ai/Step-3.5-Flash', inputPrice: 0.096, outputPrice: 0.288, qualityScore: 7 },
    ],
  },

  // === ERNIE（百度文心）===
  'ernie-4.5': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'baidu/ERNIE-4.5-300B-A47B', inputPrice: 0.275, outputPrice: 1.099, qualityScore: 9 },
    ],
  },

  // === Hunyuan（腾讯混元）===
  'hunyuan-a13b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'tencent/Hunyuan-A13B-Instruct', inputPrice: 0.137, outputPrice: 0.549, qualityScore: 7 },
    ],
  },
  'hunyuan-mt-7b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'tencent/Hunyuan-MT-7B', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 6 },
    ],
  },

  // === ByteDance Seed ===
  'seed-oss-36b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'ByteDance-Seed/Seed-OSS-36B-Instruct', inputPrice: 0.206, outputPrice: 0.549, qualityScore: 7 },
    ],
  },

  // === Ling（影刀 AI）===
  'ling-flash-2.0': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'inclusionAI/Ling-flash-2.0', inputPrice: 0.137, outputPrice: 0.549, qualityScore: 7 },
    ],
  },
  'ling-mini-2.0': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'inclusionAI/Ling-mini-2.0', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 6 },
    ],
  },

  // === InternLM ===
  'internlm2.5-7b': {
    providers: [
      { provider: 'siliconflow', upstreamModel: 'internlm/internlm2_5-7b-chat', inputPrice: 0, outputPrice: 0, free: true, qualityScore: 6 },
    ],
  },

  // === Qwen2 VL ===
  'qwen2-vl-72b': {
    supportsVision: true,
    providers: [
      { provider: 'siliconflow', upstreamModel: 'Qwen/Qwen2-VL-72B-Instruct', inputPrice: 0.567, outputPrice: 0.567, qualityScore: 8 },
    ],
  },

  // ══════════════════════════════════════════════════════
  //  Azure AI Foundry 独占模型
  //  注意：需要在 Azure Portal 部署后才能使用
  // ══════════════════════════════════════════════════════

  // === Azure Grok（xAI）===
  'grok-3': {
    providers: [
      { provider: 'azure', upstreamModel: 'grok-3', inputPrice: 3.00, outputPrice: 15.00, qualityScore: 9 },
    ],
  },
  'grok-3-mini': {
    providers: [
      { provider: 'azure', upstreamModel: 'grok-3-mini', inputPrice: 0.30, outputPrice: 0.50, qualityScore: 8 },
    ],
  },

  // === Azure Mistral ===
  'mistral-large': {
    providers: [
      { provider: 'azure', upstreamModel: 'Mistral-Large-3', inputPrice: 2.00, outputPrice: 6.00, qualityScore: 8 },
    ],
  },
  'mistral-small': {
    providers: [
      { provider: 'azure', upstreamModel: 'mistral-small-2503', inputPrice: 0.10, outputPrice: 0.30, qualityScore: 7 },
    ],
  },
  'codestral': {
    providers: [
      { provider: 'azure', upstreamModel: 'Codestral-2501-2', inputPrice: 0.20, outputPrice: 0.60, qualityScore: 8 },
    ],
  },

  // === Azure Cohere ===
  'command-r-plus': {
    providers: [
      { provider: 'azure', upstreamModel: 'Cohere-command-r-plus-08-2024', inputPrice: 2.50, outputPrice: 10.00, qualityScore: 8 },
    ],
  },
  'command-r': {
    providers: [
      { provider: 'azure', upstreamModel: 'Cohere-command-r-08-2024', inputPrice: 0.15, outputPrice: 0.60, qualityScore: 7 },
    ],
  },

  // === Azure Phi（Microsoft）===
  'phi-4': {
    providers: [
      { provider: 'azure', upstreamModel: 'Phi-4-2', inputPrice: 0.07, outputPrice: 0.14, qualityScore: 7 },
    ],
  },
  'phi-4-mini': {
    providers: [
      { provider: 'azure', upstreamModel: 'Phi-4-mini-instruct', inputPrice: 0.025, outputPrice: 0.05, qualityScore: 6 },
    ],
  },

  // === Azure DeepSeek（备用通道）===
  'deepseek-r1-azure': {
    providers: [
      { provider: 'azure', upstreamModel: 'DeepSeek-R1', inputPrice: 0.55, outputPrice: 2.19, qualityScore: 9 },
    ],
  },
  'deepseek-v3-azure': {
    providers: [
      { provider: 'azure', upstreamModel: 'DeepSeek-V3-0324', inputPrice: 0.27, outputPrice: 1.10, qualityScore: 9 },
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
