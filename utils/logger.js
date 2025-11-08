import winston from "winston";
import "winston-daily-rotate-file";
import fs from "fs";

const { combine, timestamp, json, colorize, align, printf } = winston.format;

const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER;

// Create logs directory only in development
if (!isProduction) {
  const logsDir = "logs";
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// Console transport for all environments
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize({ all: true }),
    align(),
    printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
});

// Define transports & handlers
const fileTransports = [];
const exceptionHandlers = [];
const rejectionHandlers = [];

// 🧩 Add file handlers only in dev
if (!isProduction) {
  const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: "logs/application-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
  });

  fileTransports.push(fileRotateTransport);
  exceptionHandlers.push(new winston.transports.File({ filename: "logs/exception.log" }));
  rejectionHandlers.push(new winston.transports.File({ filename: "logs/rejection.log" }));
} else {
  // 🩵 Add safe console handlers for production
  exceptionHandlers.push(consoleTransport);
  rejectionHandlers.push(consoleTransport);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "warn" : "info"),
  format: combine(
    timestamp({ format: "YYYY-MM-DD hh:mm:ss.SSS A" }),
    json()
  ),
  transports: [consoleTransport, ...fileTransports],
  exceptionHandlers,
  rejectionHandlers,

  // 🚀 Prevent Winston from crashing app on error
  exitOnError: false,
});

// Add environment-specific startup message
if (isProduction) {
  logger.info("🚀 Production logging enabled - logs will appear in Render console");
  logger.info(`📊 Log level: ${logger.level}`);
} else {
  logger.info("🔧 Development logging enabled - logs saved to files and console");
}

export default logger;
