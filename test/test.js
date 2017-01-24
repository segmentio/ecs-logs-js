var assert = require('assert');
var util = require('util');
var ecslogs = require('../lib');

function now() {
  return 1467493907000;
}

function TestError(message) {
  this.message = message
  this.stack = 'Error: ' + message + '\n'
    + '\tat test3 (test.js:3:1)\n'
    + '\tat test2 (test.js:2:1)\n'
    + '\tat test1 (test.js:1:1)\n'
}

util.inherits(TestError, Error);

describe('module', function() {
  describe('checks', function() {
    it('should have all ecs-logs levels', function() {
      var levels = [
        'debug',
        'info',
        'notice',
        'warn',
        'error',
        'crit',
        'alert',
        'emerg'
      ];

      levels.forEach(function(level) {
        assert.notStrictEqual(ecslogs[level], undefined, 'missing ecslogs.' + level);
      });
    });

    it('should export Levels, Logger, Transport, and Formatter', function() {
      var symbols = [
        'Levels',
        'Logger',
        'Transport',
        'Formatter'
      ];

      symbols.forEach(function(symbol) {
        assert.notStrictEqual(ecslogs[symbol], undefined, 'missing ecslogs.' + symbol);
      });
    });
  });
});

describe('formatter', function() {
  describe('format', function() {
    it('should format a log entry with defaults', function() {
      var formatter = new ecslogs.Formatter({
        hostname: 'localhost'
      });
      var string = formatter({
        timestamp: now
      });

      assert.deepEqual(JSON.parse(string), {
        level: 'NONE',
        time: '2016-07-02T21:11:47.000Z',
        info: {
          host: 'localhost'
        },
        data: { },
        message: ''
      });
    });

    it('should format a log entry with INFO level', function() {
      var formatter = new ecslogs.Formatter({
        hostname: 'localhost'
      });
      var string = formatter({
        timestamp: now,
        level: 'info'
      });

      assert.deepEqual(JSON.parse(string), {
        level: 'INFO',
        time: '2016-07-02T21:11:47.000Z',
        info: {
          host: 'localhost'
        },
        data: { },
        message: ''
      });
    });

    it('should format a log entry with metadata', function() {
      var formatter = new ecslogs.Formatter({
        hostname: 'localhost'
      });
      var string = formatter({
        timestamp: now,
        meta: {
          answer: 42,
        }
      });

      assert.deepEqual(JSON.parse(string), {
        level: 'NONE',
        time: '2016-07-02T21:11:47.000Z',
        info: {
          host: 'localhost'
        },
        data: {
          answer: 42
        },
        message: ''
      });
    });

    it('should format a log entry with a non-empty message', function() {
      var formatter = new ecslogs.Formatter({
        hostname: 'localhost'
      });
      var string = formatter({
        timestamp: now,
        message: 'Hello World!'
      });

      assert.deepEqual(JSON.parse(string), {
        level: 'NONE',
        time: '2016-07-02T21:11:47.000Z',
        info: {
          host: 'localhost'
        },
        data: { },
        message: 'Hello World!'
      });
    });

    it('should format a log entry with errors', function() {
      var formatter = new ecslogs.Formatter({
        hostname: 'localhost'
      });
      var string = formatter({
        timestamp: now,
        meta: {
          error: new TestError('oops!')
        }
      });

      assert.deepEqual(JSON.parse(string), {
        level: 'NONE',
        time: '2016-07-02T21:11:47.000Z',
        info: {
          host: 'localhost',
          errors: [
            {
              type: 'TestError',
              error: 'oops!',
              stack: [
                'at test3 (test.js:3:1)',
                'at test2 (test.js:2:1)',
                'at test1 (test.js:1:1)'
              ],
            }
          ]
        },
        data: { },
        message: ''
      });
    });
  });
});

describe('transport', function() {
  describe('checks', function() {
    it('should be named ecs-logs', function() {
      var transport = new ecslogs.Transport()
      assert.equal(transport.name, 'ecs-logs');
    });
  });

  describe('logs', function() {
    it('should produce log messages', function() {
      var messages = [];
      var transport = new ecslogs.Transport({
        output: function(msg) {
          messages.push(JSON.parse(msg))
        },
        timestamp: now,
        hostname: 'localhost'
      });

      transport.log('debug', '', { }, function() { });
      transport.log('info', 'Hello World!', { answer: 42 }, function() { });

      assert.deepEqual(messages, [
        {
          level: 'DEBUG',
          time: '2016-07-02T21:11:47.000Z',
          info: {
            host: 'localhost'
          },
          data: { },
          message: ''
        },
        {
          level: 'INFO',
          time: '2016-07-02T21:11:47.000Z',
          info: {
            host: 'localhost'
          },
          data: {
            answer: 42
          },
          message: 'Hello World!'
        }
      ]);
    });

    it('should produce log messages with errors', function() {
      var messages = [];
      var transport = new ecslogs.Transport({
        output: function(msg) {
          messages.push(JSON.parse(msg))
        },
        timestamp: now,
        hostname: 'localhost'
      });

      transport.log('error', 'something went wrong', {
        error: new TestError('oops!')
      }, function() { });

      assert.deepEqual(messages, [
        {
          level: 'ERROR',
          time: '2016-07-02T21:11:47.000Z',
          info: {
            host: 'localhost',
            errors: [
              {
                type: 'TestError',
                error: 'oops!',
                stack: [
                  'at test3 (test.js:3:1)',
                  'at test2 (test.js:2:1)',
                  'at test1 (test.js:1:1)'
                ],
              }
            ]
          },
          data: { },
          message: 'something went wrong'
        }
      ]);
    });
  });
});

describe('logger', function() {
  describe('checks', function() {
    it('should have all ecs-logs levels', function() {
      var logger = new ecslogs.Logger()
      var levels = [
        'debug',
        'info',
        'notice',
        'warn',
        'error',
        'crit',
        'alert',
        'emerg'
      ];

      levels.forEach(function(level) {
        assert.equal(typeof logger[level], 'function', 'missing esclogs.Logger.' + level);
      });
    });
  });

  describe('logs', function() {
    it('should produce log messages', function() {
      var messages = [];
      var logger = new ecslogs.Logger({
        output: function(msg) {
          messages.push(JSON.parse(msg))
        },
        timestamp: now,
        hostname: 'localhost'
      });

      logger.debug('');
      logger.warn('Hello World!', { answer: 42 });

      assert.deepEqual(messages, [
        {
          level: 'DEBUG',
          time: '2016-07-02T21:11:47.000Z',
          info: {
            host: 'localhost'
          },
          data: { },
          message: ''
        },
        {
          level: 'WARN',
          time: '2016-07-02T21:11:47.000Z',
          info: {
            host: 'localhost'
          },
          data: {
            answer: 42
          },
          message: 'Hello World!'
        }
      ]);
    });

    it('should produce log messages with errors', function() {
      var messages = [];
      var logger = new ecslogs.Logger({
        output: function(msg) {
          messages.push(JSON.parse(msg))
        },
        timestamp: now,
        hostname: 'localhost'
      });

      logger.error('something went wrong', {
        error: new TestError('oops!')
      });

      assert.deepEqual(messages, [
        {
          level: 'ERROR',
          time: '2016-07-02T21:11:47.000Z',
          info: {
            host: 'localhost',
            errors: [
              {
                type: 'TestError',
                error: 'oops!',
                stack: [
                  'at test3 (test.js:3:1)',
                  'at test2 (test.js:2:1)',
                  'at test1 (test.js:1:1)'
                ],
              }
            ]
          },
          data: { },
          message: 'something went wrong'
        }
      ]);
    });

    it('should produce log messages with top-level errors', function() {
      var messages = [];
      var logger = new ecslogs.Logger({
        output: function(msg) {
          messages.push(JSON.parse(msg))
        },
        timestamp: now,
        hostname: 'localhost'
      });

      logger.error('something went wrong', new TestError('oops!'));

      assert.deepEqual(messages, [
        {
          level: 'ERROR',
          time: '2016-07-02T21:11:47.000Z',
          info: {
            host: 'localhost',
            errors: [
              {
                type: 'TestError',
                error: 'oops!',
                stack: [
                  'at test3 (test.js:3:1)',
                  'at test2 (test.js:2:1)',
                  'at test1 (test.js:1:1)'
                ],
              }
            ]
          },
          data: {
            message: 'oops!',
            stack: "Error: oops!\n\tat test3 (test.js:3:1)\n\tat test2 (test.js:2:1)\n\tat test1 (test.js:1:1)\n"
          },
          message: 'something went wrong'
        }
      ]);
    });

    it('should not produce log messages below warnings', function() {
      var messages = [];
      var logger = new ecslogs.Logger({
        output: function(msg) {
          messages.push(JSON.parse(msg))
        },
        level: 'warn',
        timestamp: now,
        hostname: 'localhost'
      });

      logger.debug('Hello World!', { answer: 42 });
      logger.info('Hello World!', { answer: 42 });
      logger.warn('Hello World!', { answer: 42 });

      assert.deepEqual(messages, [
        {
          level: 'WARN',
          time: '2016-07-02T21:11:47.000Z',
          info: {
            host: 'localhost'
          },
          data: {
            answer: 42
          },
          message: 'Hello World!'
        }
      ]);
    });
  });
});
