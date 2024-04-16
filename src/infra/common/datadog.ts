import { createLogger, format, transports } from 'winston';

const DD_API_KEY = process.env.DATADOG_CLIENT_TOKEN ?? '';

export const logger = createLogger({
  level: 'info',
  exitOnError: false,
  format: format.json(),
  transports: [
    new transports.Http({
      host: 'http-intake.logs.us5.datadoghq.com',
      path: `/api/v2/logs?dd-api-key=${DD_API_KEY}&ddsource=nodejs&service=AdminRayoApp`,
      ssl: true,
    }),
  ],
});
