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

const circuits = new Map<string, CircuitStateData>();

const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 3,
  timeoutMs: 30000,
  name: "default",
};

function getCircuit(name: string): CircuitStateData {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: "CLOSED",
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      openedAt: null,
    });
  }
  return circuits.get(name)!;
}

export function getCircuitState(name: string): CircuitState {
  return getCircuit(name).state;
}

export function isCircuitOpen(name: string): boolean {
  const circuit = getCircuit(name);
  if (circuit.state === "CLOSED") return false;

  if (circuit.state === "OPEN" && circuit.openedAt) {
    const elapsed = Date.now() - circuit.openedAt;
    if (elapsed >= defaultConfig.timeoutMs) {
      circuit.state = "HALF_OPEN";
      circuit.successes = 0;
      return false;
    }
    return true;
  }

  return circuit.state === "OPEN";
}

export function recordSuccess(name: string): void {
  const circuit = getCircuit(name);
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
}

export function recordFailure(name: string): void {
  const circuit = getCircuit(name);
  circuit.failures++;
  circuit.lastFailureTime = Date.now();

  if (circuit.state === "HALF_OPEN") {
    circuit.state = "OPEN";
    circuit.openedAt = Date.now();
  } else if (circuit.state === "CLOSED" && circuit.failures >= defaultConfig.failureThreshold) {
    circuit.state = "OPEN";
    circuit.openedAt = Date.now();
  }
}

export function resetCircuit(name: string): void {
  circuits.delete(name);
}

export async function circuitBreakerWrapper<T>(
  name: string,
  fn: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  if (isCircuitOpen(name)) {
    return fallback();
  }

  try {
    const result = await fn();
    recordSuccess(name);
    return result;
  } catch (error) {
    recordFailure(name);
    return fallback();
  }
}