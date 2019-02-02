import {
  Logger as WinstonLogger,
  TransportInstance,
  Transport as WinstonTransport,
  AbstractConfigSetLevels
} from 'winston'

interface LoggerOptions {
  /**
   * The minimum level for log messages this logger will pass to its transports.
   * @default 'debug'
   */
  level?: string
  /**
   * An array of winston transports that the logger will be passing log messages to, defaults to a single instance of Transport.
   */
  transports?: TransportInstance[]
}

/**
 * The Logger type is a winston logger with preconfigured defaults to output log messages compatible with ecs-logs.
 */
export class Logger extends WinstonLogger {
  constructor(options?: LoggerOptions)
}

interface TransportOptions {
  /**
   * The transport name.
   * @default 'ecs-logs'
   */
  name?: string
  /**
   * The transport level, defaults to 'debug' messages, this is passed to the default formatter if none was provided
   * @default 'debug'
   */
  level?: string
  /**
   * A winston formatter, defaults to an instance of Formatter.
   */
  formatter?: Formatter
  /**
   * A function called when the transport has a log message to send, defaults to writing to stdout.
   */
  output?(message: string): void
  /**
   * A function returning timestamps.
   * @default Date.now
   */
  timestamp?(): number
}

/**
 * The Transport type implements a winston log transport preconfigured to output log messages compatible with ecs-logs.
 */
export class Transport extends WinstonTransport {
  constructor(options?: TransportOptions)
}

interface FormatterOptions {
  /**
   * The hostname to report in the log messages, defaults to the value returned by os.hostname().
   */
  hostname?: string
}

/**
 * The Formatter type implements a winston log formatter that produces messages compatible with ecs-logs.
 */
export class Formatter {
  constructor(options?: FormatterOptions)
}

interface ILevels extends AbstractConfigSetLevels {
  emerg: 0
  alert: 1
  crit: 2
  error: 3
  warn: 4
  notice: 5
  info: 6
  debug: 7
}

export const Levels: ILevels
