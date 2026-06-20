import { redis } from "@/lib/redis";

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

const REDIS_KEY_PREFIX = "circuit:";
const localCircuits = new Map<string, CircuitStateData>();

const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 3,
  timeoutMs: 30000,
  name: "default",
};

async function getCircuit(name: string): Promise<CircuitStateData> {
  if (redis && redis.status === "ready") {
    try {
      const data = await redis.get(`${REDIS_KEY_PREFIX}${name}`);
      if (data) return JSON.parse(data);
    } catch {
      // fall through to local
    }
  }

  if (!localCircuits.has(name)) {
    localCircuits.set(name, {
      state: "CLOSED",
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      openedAt: null,
    });
  }
  return localCircuits.get(name)!;
}

async function saveCircuit(name: string, data: CircuitStateData): Promise<void> {
  localCircuits.set(name, data);
  if (redis && redis.status === "ready") {
    try {
      await redis.setex(`${REDIS_KEY_PREFIX}${name}`, 300, JSON.stringify(data));
    } catch {
      // silently fail
    }
  }
}

export async function getCircuitState(name: string): Promise<CircuitState> {
  const circuit = await getCircuit(name);
  return circuit.state;
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
  if (circuit.state === "HALF_OPEN") {
    circuit.successes++;
    if (circuit.successes >= defaultConfig.successThreshold) {
      circuit.state = "CLOSED";
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.openedAt = null;
      circuit.lastFailureTime = null;
    }
  } else if (circuit.state === "CLOSED") {
    circuit.failures = 0;
  }
  await saveCircuit(name, circuit);
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
  if (redis && redis.status === "ready") {
    try {
      await redis.del(`${REDIS_KEY_PREFIX}${name}`);
    } catch {
      // silently fail
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
  } catch (error) {
    await recordFailure(name);
    return fallback();
  }
}
