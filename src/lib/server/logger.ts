import fs from "node:fs";
import path from "node:path";
import pino from "pino";

const isDevelopment = process.env.APP_ENV === "development";
const logLevel = process.env.LOG_LEVEL ?? "info";
const logFormat = process.env.LOG_FORMAT ?? "pretty";

// Base Pino configuration
const pinoConfig: pino.LoggerOptions = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
};

// Log file configuration (if specified)
const logFile = process.env.LOG_FILE;

if (logFile) {
  // Create logs directory if it doesn't exist
  const logDir = path.dirname(logFile);

  if (!fs.existsSync(logDir) && !isDevelopment) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  if (isDevelopment) {
    // In development: only pretty console (ignore file)
    pinoConfig.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
        singleLine: false,
      },
    };
  } else {
    // In production: only JSON file
    pinoConfig.transport = {
      target: "pino/file",
      options: { destination: logFile },
    };
  }
} else if (isDevelopment && logFormat === "pretty") {
  // Only pretty console (no file)
  pinoConfig.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss",
      ignore: "pid,hostname",
      singleLine: false,
    },
  };
}

// Create and export the logger
export const logger = pino(pinoConfig);

// Helper for HTTP request logging
export const httpLogger = pino({
  ...pinoConfig,
  serializers: {
    req (req) {
      return {
        method: req.method,
        url: req.url,
        headers: req.headers,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      };
    },
    res (res) {
      return {
        statusCode: res.statusCode,
        headers: res.getHeaders?.(),
      };
    },
  },
});

export default logger;
