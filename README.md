## ecs-logs-js
**Basic usage**
```js
var log = require('ecs-logs-js');

log.debug('debug message, not logged if NODE_ENV=production');
log.info('Hi there!');
```

### Logger
The Logger type is a winston logger with preconfigured defaults to output
log messages compatible with ecs-logs.

**Creating and using a Logger**
```js
var ecslogs = require('ecs-logs-js');

var log = new ecslogs.Logger({
  level: 'info'
});

log.info('Hi there!');
```

### Transport
The Transport type implements a winston log transport preconfigured to
output log messages compatible with ecs-logs.

**Creating and using a Transport in a winston logger**
```js
var eslogs = require('ecs-logs-js');
var winston = require('winston');

// Instantiate an ecs-logs compatible winston logger with ecslogs.Transport
var logger = new winston.Logger({
  transports: [
    new ecslogs.Transport()
  ]
});
```

### Formatter
The Formatter type implements a winston log formatter that produces messages
compatible with ecs-logs.

The object returned when instantiating the Formatter type is callable. When
called, it expects a log entry object.

When a formatter instance is called it accepts a log entry as argument and
returns a JSON representation of the entry in a format compatible with
ecs-logs.

**Creating and using a Formatter in a winston logger**
```js
var eslogs = require('ecs-logs-js');
var winston = require('winston');

// Instantiate an ecs-logs compatible winston logger with ecslogs.Formatter
var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      timestamp: Date.now,
      formatter: new ecslogs.Formatter()
    })
  ]
});
```
**Using a Formatter to serialize log entries**
```js
var eslogs = require('ecs-logs-js');
var formatter = new ecslogs.Formatter();

// Returns a serialized log message compatible with ecs-logs.
var s = formatter({
  message: 'the log message',
  level: 'info',
  meta: {
    'User-Agent': 'node'
  }
});
```
