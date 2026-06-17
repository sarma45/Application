import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { logger } from "@/lib/logger";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://otel-collector:4318";

const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
});

const metricExporter = new OTLPMetricExporter({
  url: `${otlpEndpoint}/v1/metrics`,
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 60000,
});

export const sdk = new NodeSDK({
  traceExporter,
  metricReader,
  serviceName: "aiverse",
});

export async function startTracing() {
  try {
    if (process.env.OTEL_ENABLED !== "true") {
      logger.info("OpenTelemetry tracing is disabled (OTEL_ENABLED != true)");
      return;
    }
    await sdk.start();
    logger.info("OpenTelemetry tracing started");
  } catch (err) {
    logger.warn("Failed to start OpenTelemetry", { error: String(err) });
  }
}

export async function shutdownTracing() {
  try {
    await sdk.shutdown();
  } catch {
    // ignore
  }
}
