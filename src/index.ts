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

/** Available levels */
export type LEVEL = keyof typeof LEVELS_MAP

interface LogLine {
  level: string
  time: string
  message: string
  data: unknown
}

/** Checks that the level is valid */
function validateLevel(level: string): asserts level is LEVEL {
  if (!(level in LEVELS_MAP)) {
    throw new Error(`Invalid log level '${level}'`)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedError: any = serializeError(value)
    // Tidy up the stack trace a bit and convert it to an array
    serializedError.stack = extractStack.lines(value)
    return serializedError
  }

  return value
}

export interface LoggerOptions {
  /**
   * Configures the minimum level a log has to be in order to be output
   * @default 'debug'
   */
  level?: LEVEL | string
  /**
   * Configures whether human friendly logs are output
   * @default process.env.NODE_ENV === 'development'
   */
  devMode?: boolean
}

export class Logger {
  level: LEVEL = 'debug'
  devMode = process.env.NODE_ENV === 'development'

  constructor(options: LoggerOptions = {}) {
    if (options.level) {
      validateLevel(options.level)
      this.level = options.level
    }

    if (options.devMode) {
      this.devMode = options.devMode
    }
  }

  /** Logs a message with some optional data */
  log = (level: LEVEL, message: string, data?: unknown): void => {
    if (LEVELS_MAP[level] > LEVELS_MAP[this.level]) {
      return
    }

    const logLineObject: LogLine = {
      level: level.toUpperCase(),
      time: new Date().toISOString(),
      message,
      data,
    }

    // Create JSON string with all the exotic values converted to JSON safe versions
    let logLine = safeStringify(logLineObject, jsonStringifyReplacer)

    // Format the logs in a human friendly way in development mode
    if (this.devMode) {
      // Construct the main log line and add some highlighting styles
      // Just parse the production log because it already has all the data conversions applied
      const log: LogLine = JSON.parse(logLine)
      logLine = chalk.bold(`\n${log.level}: ${log.message}`)

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

    process.stdout.write(logLine + '\n')
  }

  /** Logs a message at the EMERG level with some optional data */
  emerg = (message: string, data?: unknown): void => {
    this.log('emerg', message, data)
  }

  /** Logs a message at the ALERT level with some optional data */
  alert = (message: string, data?: unknown): void => {
    this.log('alert', message, data)
  }

  /** Logs a message at the CRIT level with some optional data */
  crit = (message: string, data?: unknown): void => {
    this.log('crit', message, data)
  }

  /** Logs a message at the ERROR level with some optional data */
  error = (message: string, data?: unknown): void => {
    this.log('error', message, data)
  }

  /** Logs a message at the WARN level with some optional data */
  warn = (message: string, data?: unknown): void => {
    this.log('warn', message, data)
  }

  /** Logs a message at the NOTICE level with some optional data */
  notice = (message: string, data?: unknown): void => {
    this.log('notice', message, data)
  }

  /** Logs a message at the INFO level with some optional data */
  info = (message: string, data?: unknown): void => {
    this.log('info', message, data)
  }

  /** Logs a message at the DEBUG level with some optional data */
  debug = (message: string, data?: unknown): void => {
    this.log('debug', message, data)
  }
}
