import type { Provider, ProviderOption, RoutingStrategy } from '../config/models.js';

// 供应商指标（滑动窗口统计）
interface ProviderMetrics {
  // 最近 N 次请求的延迟（ms）
  latencies: number[];
  // 成功/失败计数
  successCount: number;
  failureCount: number;
  // 最后更新时间
  lastUpdated: number;
}

// 滑动窗口大小
const WINDOW_SIZE = 50;
// 指标过期时间（30 分钟没有新数据则重置）
const METRICS_TTL_MS = 30 * 60 * 1000;

class ProviderHealthTracker {
  private metrics = new Map<Provider, ProviderMetrics>();

  // 记录一次成功请求
  recordSuccess(provider: Provider, latencyMs: number) {
    const m = this.getOrCreate(provider);
    m.latencies.push(latencyMs);
    if (m.latencies.length > WINDOW_SIZE) m.latencies.shift();
    m.successCount++;
    m.lastUpdated = Date.now();
  }

  // 记录一次失败请求
  recordFailure(provider: Provider) {
    const m = this.getOrCreate(provider);
    m.failureCount++;
    m.lastUpdated = Date.now();
  }

  // 获取平均延迟（ms），无数据时返回默认值
  getAvgLatency(provider: Provider): number {
    const m = this.metrics.get(provider);
    if (!m || m.latencies.length === 0 || this.isStale(m)) return 1000; // 默认 1000ms
    return m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length;
  }

  // 获取成功率（0-1），无数据时返回默认值
  getSuccessRate(provider: Provider): number {
    const m = this.metrics.get(provider);
    if (!m || this.isStale(m)) return 0.95; // 默认 95%
    const total = m.successCount + m.failureCount;
    if (total === 0) return 0.95;
    return m.successCount / total;
  }

  // 判断供应商是否健康（成功率 > 50%）
  isHealthy(provider: Provider): boolean {
    return this.getSuccessRate(provider) > 0.5;
  }

  // 根据策略对供应商列表排序（返回排序后的副本）
  sortByStrategy(options: ProviderOption[], strategy: RoutingStrategy): ProviderOption[] {
    const sorted = [...options];
    switch (strategy) {
      case 'price':
        // 按总价（输入+输出均价）升序
        sorted.sort((a, b) => (a.inputPrice + a.outputPrice) - (b.inputPrice + b.outputPrice));
        break;
      case 'speed':
        // 按平均延迟升序
        sorted.sort((a, b) => this.getAvgLatency(a.provider) - this.getAvgLatency(b.provider));
        break;
      case 'quality':
        // 按质量评分降序，同分则按成功率降序
        sorted.sort((a, b) => {
          const diff = b.qualityScore - a.qualityScore;
          if (diff !== 0) return diff;
          return this.getSuccessRate(b.provider) - this.getSuccessRate(a.provider);
        });
        break;
    }
    return sorted;
  }

  // 获取所有供应商的实时指标（供 API 返回）
  getAllMetrics(): Record<string, { avgLatency: number; successRate: number; requests: number }> {
    const result: Record<string, { avgLatency: number; successRate: number; requests: number }> = {};
    for (const [provider, m] of this.metrics) {
      if (this.isStale(m)) continue;
      result[provider] = {
        avgLatency: Math.round(this.getAvgLatency(provider)),
        successRate: Math.round(this.getSuccessRate(provider) * 100),
        requests: m.successCount + m.failureCount,
      };
    }
    return result;
  }

  private getOrCreate(provider: Provider): ProviderMetrics {
    let m = this.metrics.get(provider);
    if (!m || this.isStale(m)) {
      m = { latencies: [], successCount: 0, failureCount: 0, lastUpdated: Date.now() };
      this.metrics.set(provider, m);
    }
    return m;
  }

  private isStale(m: ProviderMetrics): boolean {
    return Date.now() - m.lastUpdated > METRICS_TTL_MS;
  }
}

// 全局单例
export const providerHealth = new ProviderHealthTracker();
