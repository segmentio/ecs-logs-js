/**
 * @module ecs-logs-js
 *
 * @example
 * var log = require('ecs-logs-js');
 *
 * log.debug('debug message, not logged if NODE_ENV=production');
 * log.info('Hi there!');
 */

var os = require('os');
var util = require('util');
var winston = require('winston');
var typeName = require('type-name');
var stringify = require('safe-json-stringify');

/**
 * Levels maps the winston log levels exposed by the ecslogs.Logger..
 */
var Levels = {
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warn: 4,
  notice: 5,
  info: 6,
  debug: 7
};

/**
 * The Logger type is a winston logger with preconfigured defaults to output
 * log messages compatible with ecs-logs.
 *
 * @example
 * var ecslogs = require('ecs-logs-js');
 *
 * var log = new ecslogs.Logger({
 *   level: 'info'
 * });
 *
 * log.info('Hi there!');
 *
 * @param {Object} [options] The configuration object for the new logger,
 * besides the properties documented here the options object can also carry all
 * properties that the Transport and Formatter constructors accept, they will be
 * passed to the default transport and formatter instantiated if none was given.
 *
 * @param {string} [level] The minimum level for log messages this logger will
 * pass to its transports, defaults to 'debug'
 *
 * @param {transports} [Object[]] An array of winston transports that the logger
 * will be passing log messages to, defaults to a single instance of Transport.
 */
function Logger(options) {
  if (!options) {
    options = { };
  }

  if (typeof options.level === 'undefined') {
    options.level = 'debug';
  }

  if (!options.transports) {
    options.transports = [new Transport(options)];
    delete options.name;
    delete options.hostname;
    delete options.timestamp;
    delete options.formatter;
  }

  Logger.super_.call(this, options);
  this.setLevels(options.levels || Levels);
}

util.inherits(Logger, winston.Logger);

/**
 * The Transport type implements a winston log transport preconfigured to
 * output log messages compatible with ecs-logs.
 *
 * @example
 * var ecslogs = require('ecs-logs-js');
 * var winston = require('winston');
 *
 * // Instantiate an ecs-logs compatible winston logger with ecslogs.Transport
 * var logger = new winston.Logger({
 *   transports: [
 *     new ecslogs.Transport()
 *   ]
 * });
 *
 * @param {Object} [options] The configuration object for the new transport,
 * besides the properties documented here the options object can also carry all
 * properties that the Formatter constructor accepts, they will be passed to the
 * default formatter instantiated if none was given.
 *
 * @param {string} [options.name] The transport name, defaults to 'ecs-logs'
 *
 * @param {string} [options.level] The transport level, defaults to 'debug'
 * messages, this is passed to the default formatter if none was provided
 *
 * @param {function} [options.output] A function called when the transport has
 * a log message to send, defaults to writing to stdout.
 *
 * @param {function} [options.timestamp] A function returning timestamps,
 * defaults to Date.now
 *
 * @param {Object} [options.formatter] A winston formatter, defaults to an
 * instance of Formatter
 */
function Transport(options) {
  if (!options) {
    options = { };
  }

  this.name = options.name || 'ecs-logs';
  this.level = options.level || 'debug';
  this.output = options.output || function(s) {
    process.stdout.write(s + '\n');
  };
  this.timestamp = options.timestamp || Date.now;
  this.formatter = options.formatter || new Formatter({
    hostname: options.hostname
  });
}

util.inherits(Transport, winston.Transport);

Transport.prototype.log = function(level, message, meta, callback) {
  this.output(this.formatter({
    level: level,
    meta: meta,
    message: message,
    timestamp: this.timestamp,
    formatter: this.formatter
  }));
  callback(null, true);
};

/**
 * The Formatter type implements a winston log formatter that produces messages
 * compatible with ecs-logs.
 *
 * The object returned when instantiating the Formatter type is callable. When
 * called, it expects a log entry object.
 *
 * @example
 * var ecslogs = require('ecs-logs-js');
 * var winston = require('winston');
 *
 * // Instantiate an ecs-logs compatible winston logger with ecslogs.Formatter
 * var logger = new winston.Logger({
 *   transports: [
 *     new winston.transports.Console({
 *       timestamp: Date.now,
 *       formatter: new ecslogs.Formatter()
 *     })
 *   ]
 * });
 *
 * @example
 * var ecslogs = require('ecs-logs-js');
 * var formatter = new ecslogs.Formatter();
 *
 * // Returns a serialized log message compatible with ecs-logs.
 * var s = formatter({
 *   message: 'the log message',
 *   level: 'info',
 *   meta: {
 *     'User-Agent': 'node'
 *   }
 * });
 *
 * @param {Object} [options] The configuration object for the new formatter
 *
 * @param {string} [options.hostname] The hostname to report in the log
 * messages, defaults to the value returned by os.hostname()
 *
 * @return {string} When a formatter instance is called it accepts a log entry
 * as argument and returns a JSON representation of the entry in a format
 * compatible with ecs-logs
 */
function Formatter(options) {
  function format(entry) {  // eslint-disable-line
    return stringify(makeEvent(entry, format.hostname));
  }

  if (!options) {
    options = { };
  }

  Object.setPrototypeOf(format, Formatter.prototype);
  format.hostname = options.hostname || os.hostname();
  return format;
}

util.inherits(Formatter, Function);

/**
 * Given a log entry and an optional hostname the function generates and returns
 * an ecs-logs event.
 *
 * @param {Object} entry A log entry, this is the type of objects received by
 * formatters.
 *
 * @param {string} [hostname] An optional hostname to set on the event.
 *
 * @return {Object} An ecs-logs event generated from the arguments.
 */
function makeEvent(entry, hostname) {
  var errors = extractErrors(entry.meta);
  var event = {
    level: entry.level ? entry.level.toUpperCase() : 'NONE',
    time: new Date(
      entry.timestamp ? entry.timestamp() : Date.now()
    ).toISOString(),
    info: { },
    data: entry.meta || { },
    message: entry.message || ''
  };

  if (hostname) {
    event.info.host = hostname;
  }

  if (errors.length) {
    errors.forEach(function(e, i) {
      errors[i] = makeEventError(e);
    });
    event.info.errors = errors;
  }

  return event;
}

/**
 * Given an error object, returns an event error as expected in the `info` field
 * of ecs-logs messages.
 *
 * @param {Object} error The error object to convert.
 *
 * @return {Object} An event error object generated from the argument.
 */
function makeEventError(error) {
  var stack = error.stack.split('\n');

  stack.splice(0, 1);
  stack.forEach(function(s, i) {
    stack[i] = s.trim();
  });

  return {
    type: typeName(error),
    error: error.message,
    stack: stack.filter(function(s) {
      return s;
    })
  };
}

/**
 * Scans the object passed as argument looking for Error values. The values that
 * matched are removed from the object and placed in the array returned by the
 * function.
 *
 * Only the top-level properties of the object are checked, the function doesn't
 * search the object recursively.
 *
 * @param {Object} obj The object to extract errors from.
 *
 * @return {Array} The list of errors extracted from the object.
 */
function extractErrors(obj) {
  if (obj instanceof Error) {
    return [obj];
  }
  var errors = [];

  if (obj) {
    Object.keys(obj).forEach(function(key) {
      var val = obj[key];

      if (val instanceof Error) {
        errors.push(val);
        delete obj[key];
      }
    });
  }

  return errors;
}

var log = new Logger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

module.exports = {
  Levels: Levels,
  Logger: Logger,
  Transport: Transport,
  Formatter: Formatter,
  debug: log.debug,
  info: log.info,
  notice: log.notice,
  warn: log.warn,
  error: log.error,
  crit: log.crit,
  alert: log.alert,
  emerg: log.emerg
};
