import 'reflect-metadata';

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import { validateEnv } from './env.vars';

const env = validateEnv(process.env);

const resource = resourceFromAttributes({
  [SemanticResourceAttributes.SERVICE_NAME]: env.APP_NAME || 'erpiam-api-svc',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  'deployment.environment': env.NODE_ENV,
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url: env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  }),
  logRecordProcessor: new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url: env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
    }),
  ),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', async () => {
  await sdk.shutdown();
});
