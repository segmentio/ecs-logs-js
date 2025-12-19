import safeStringify from 'fast-safe-stringify'
import { serializeError } from 'serialize-error'
import extractStack from 'extract-stack'
import replaceString from 'replace-string'
import chalk from 'chalk'
import yaml from 'js-yaml'

const LEVELS_MAP = {
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warn: 4,
  notice: 5,
  info: 6,
  debug: 7,
}

/** Available log levels. */
export type LEVEL = keyof typeof LEVELS_MAP

/** Structure of a log line before formatting. */
export interface LogLine {
  level: string
  time: string
  message: string
  data?: unknown
}

/** Checks that the level is valid */
function validateLevel(level: string): asserts level is LEVEL {
  if (!(level in LEVELS_MAP)) {
    throw new Error(`Invalid log level '${level}'`)
  }
}

class ErrorArrayStack {
  stack: string[];
  message: string;
  name: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  constructor(message: string, stack: string[]) {
    this.message = message;
    this.name = 'ErrorArrayStack';
    this.stack = stack;
  }
}

/** JSON.stringify replacer that converts unstringifyable values to stringifyable ones */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonStringifyReplacer(_key: string, value: unknown): any {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (value instanceof Map) {
    return Array.from(value.entries())
  }

  if (value instanceof Set) {
    return Array.from(value)
  }

  if (value instanceof Error) {
    const serializedError = serializeError(value)
    // Tidy up the stack trace a bit and convert it to an array
    const s = new ErrorArrayStack(serializedError.message || '', extractStack.lines(value))
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key) && key !== 'message' && key !== 'stack' && key !== 'name') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        s[key] = (value as {[key: string]: any})[key];
      }
    }
    return s;
  }

  return value
}

/** A function that writes log output. */
export type LogWriter = (output: string) => void

/** The default writer that outputs to stdout. */
export const defaultWriter: LogWriter = (output: string) => {
  process.stdout.write(output + '\n')
}

/** Options that can be passed to the Logger constructor. */
export interface LoggerOptions {
  /**
   * Sets the maximum log level that will be output. By setting this option to 'info', it can be used to disable debug logs in production.
   * @default 'debug'
   */
  level?: LEVEL
  /**
   * Enables the human friendly development output.
   * @default process.env.NODE_ENV === 'development'
   */
  devMode?: boolean
  /**
   * Custom writer function for log output. Useful for testing or redirecting logs.
   * @default defaultWriter (writes to process.stdout)
   */
  writer?: LogWriter
}

/**
 * Formats a log line object into a string.
 * @param logLineObject The log line object containing level, time, message, and optional data.
 * @param devMode Whether to format for development mode (human-readable) or production (JSON).
 * @returns The formatted log string.
 */
export function formatLogLine(logLineObject: LogLine, devMode: boolean): string {
  // Create JSON string with all the exotic values converted to JSON safe versions
  let logLine = safeStringify(logLineObject, jsonStringifyReplacer)

  // Format the logs in a human friendly way in development mode
  if (devMode) {
    // Construct the main log line and add some highlighting styles
    // Just parse the production log because it already has all the data conversions applied
    const log: LogLine = JSON.parse(logLine) as LogLine
    logLine = chalk.bold(`\n${log.level}: ${log.message}`)

    const level = log.level.toLowerCase() as LEVEL
    if (level === 'warn') {
      logLine = chalk.yellow(logLine)
    } else if (LEVELS_MAP[level] <= LEVELS_MAP.error) {
      logLine = chalk.red(logLine)
    }

    // Convert data to a compact and readable format
    if (log.data) {
      let data = yaml.safeDump(log.data, { schema: yaml.JSON_SCHEMA, lineWidth: Infinity })

      // Indent the data slightly
      data = data
        .trim()
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')

      // Shorten the absolute file paths
      data = replaceString(data, process.cwd(), '.')

      logLine += `\n${data}`
    }
  }

  return logLine
}

/** Creates a new logger instance. */
export class Logger {
  level: LEVEL = 'debug'
  devMode = process.env.NODE_ENV === 'development'
  private writer: LogWriter = defaultWriter

  constructor(options: LoggerOptions = {}) {
    if (options.level) {
      validateLevel(options.level)
      this.level = options.level
    }

    if (options.devMode) {
      this.devMode = options.devMode
    }

    if (options.writer) {
      this.writer = options.writer
    }
  }

  /**
   * Logs a message at the given log level.
   * @param level Log level for the message.
   * @param message The message to log.
   * @param data Any additional data to log with the message. This can be any type.
   */
  log = (level: LEVEL, message: string, data?: unknown): void => {
    if (LEVELS_MAP[level] > LEVELS_MAP[this.level]) {
      return
    }

    const logLineObject: LogLine = {
      level: level.toUpperCase(),
      time: new Date().toISOString(),
      message,
      data: data,
    }

    const logLine = formatLogLine(logLineObject, this.devMode)
    this.writer(logLine)
  }

  /**
   * Logs a message at the EMERG log level.
   * @param message The message to log.
   * @param data Any additional data to log with the message. This can be any type.
   */
  emerg = (message: string, data?: unknown): void => {
    this.log('emerg', message, data)
  }

  /**
   * Logs a message at the ALERT log level.
   * @param message The message to log.
   * @param data Any additional data to log with the message. This can be any type.
   */
  alert = (message: string, data?: unknown): void => {
    this.log('alert', message, data)
  }

  /**
   * Logs a message at the CRIT log level.
   * @param message The message to log.
   * @param data Any additional data to log with the message. This can be any type.
   */
  crit = (message: string, data?: unknown): void => {
    this.log('crit', message, data)
  }

  /**
   * Logs a message at the ERROR log level.
   * @param message The message to log.
   * @param data Any additional data to log with the message. This can be any type.
   */
  error = (message: string, data?: unknown): void => {
    this.log('error', message, data)
  }

  /**
   * Logs a message at the WARN log level.
   * @param message The message to log.
   * @param data Any additional data to log with the message. This can be any type.
   */
  warn = (message: string, data?: unknown): void => {
    this.log('warn', message, data)
  }

  /**
   * Logs a message at the NOTICE log level.
   * @param message The message to log.
   * @param data Any additional data to log with the message. This can be any type.
   */
  notice = (message: string, data?: unknown): void => {
    this.log('notice', message, data)
  }

  /**
   * Logs a message at the INFO log level.
   * @param message The message to log.
   * @param data Any additional data to log with the message. This can be any type.
   */
  info = (message: string, data?: unknown): void => {
    this.log('info', message, data)
  }

  /**
   * Logs a message at the DEBUG log level.
   * @param message The message to log.
   * @param data Any additional data to log with the message. This can be any type.
   */
  debug = (message: string, data?: unknown): void => {
    this.log('debug', message, data)
  }
}
