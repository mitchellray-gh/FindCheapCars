import Bottleneck from 'bottleneck';

const limiters = new Map<string, Bottleneck>();

export function getLimiter(domain: string, maxConcurrent = 2, minTime = 3000): Bottleneck {
  if (!limiters.has(domain)) {
    limiters.set(
      domain,
      new Bottleneck({
        maxConcurrent,
        minTime,
        reservoir: 10,
        reservoirRefreshAmount: 10,
        reservoirRefreshInterval: 60 * 1000,
      }),
    );
  }
  return limiters.get(domain)!;
}

export function randomDelay(min = 2000, max = 8000): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min) + min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
