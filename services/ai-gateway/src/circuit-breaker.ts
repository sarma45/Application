import Redis from "ioredis";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  name: string;
}

interface CircuitStateData {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  openedAt: number | null;
}

const redisUrl = process.env.REDIS_URL || "redis://:aiverse@localhost:6379";
const redis = redisUrl ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 3 }) : null;

if (redis) {
  redis.on("error", () => {});
}

const localCircuits = new Map<string, CircuitStateData>();

const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 3,
  timeoutMs: 30000,
  name: "default",
};

async function getCircuit(name: string): Promise<CircuitStateData> {
  const defaultData: CircuitStateData = {
    state: "CLOSED",
    failures: 0,
    successes: 0,
    lastFailureTime: null,
    openedAt: null,
  };

  if (!redis) {
    if (!localCircuits.has(name)) {
      localCircuits.set(name, defaultData);
    }
    return localCircuits.get(name)!;
  }

  try {
    const data = await redis.get(`ai-gateway:circuit:${name}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn("Failed to get circuit from Redis, using local fallback", error);
  }

  if (!localCircuits.has(name)) {
    localCircuits.set(name, defaultData);
  }
  return localCircuits.get(name)!;
}

async function saveCircuit(name: string, data: CircuitStateData): Promise<void> {
  localCircuits.set(name, data);
  if (redis) {
    try {
      await redis.set(`ai-gateway:circuit:${name}`, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save circuit to Redis", error);
    }
  }
}

export async function getCircuitState(name: string): Promise<CircuitState> {
  const c = await getCircuit(name);
  return c.state;
}

export async function isCircuitOpen(name: string): Promise<boolean> {
  const circuit = await getCircuit(name);
  if (circuit.state === "CLOSED") return false;

  if (circuit.state === "OPEN" && circuit.openedAt) {
    const elapsed = Date.now() - circuit.openedAt;
    if (elapsed >= defaultConfig.timeoutMs) {
      circuit.state = "HALF_OPEN";
      circuit.successes = 0;
      await saveCircuit(name, circuit);
      return false;
    }
    return true;
  }

  return circuit.state === "OPEN";
}

export async function recordSuccess(name: string): Promise<void> {
  const circuit = await getCircuit(name);
  let changed = false;
  if (circuit.state === "HALF_OPEN") {
    circuit.successes++;
    if (circuit.successes >= defaultConfig.successThreshold) {
      circuit.state = "CLOSED";
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.openedAt = null;
      circuit.lastFailureTime = null;
    }
    changed = true;
  } else if (circuit.state === "CLOSED") {
    if (circuit.failures !== 0) {
      circuit.failures = 0;
      changed = true;
    }
  }
  if (changed) {
    await saveCircuit(name, circuit);
  }
}

export async function recordFailure(name: string): Promise<void> {
  const circuit = await getCircuit(name);
  circuit.failures++;
  circuit.lastFailureTime = Date.now();

  if (circuit.state === "HALF_OPEN") {
    circuit.state = "OPEN";
    circuit.openedAt = Date.now();
  } else if (circuit.state === "CLOSED" && circuit.failures >= defaultConfig.failureThreshold) {
    circuit.state = "OPEN";
    circuit.openedAt = Date.now();
  }
  await saveCircuit(name, circuit);
}

export async function resetCircuit(name: string): Promise<void> {
  localCircuits.delete(name);
  if (redis) {
    try {
      await redis.del(`ai-gateway:circuit:${name}`);
    } catch (error) {
      console.warn("Failed to delete circuit in Redis", error);
    }
  }
}

export async function circuitBreakerWrapper<T>(
  name: string,
  fn: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  if (await isCircuitOpen(name)) {
    return fallback();
  }

  try {
    const result = await fn();
    await recordSuccess(name);
    return result;
  } catch (error: any) {
    if (error && error.status >= 400 && error.status < 500) {
      throw error;
    }
    await recordFailure(name);
    return fallback();
  }
}
