<a name="module_ecs-logs-js"></a>

## ecs-logs-js
**Example**  
```js
var log = require('ecs-logs-js');

log.debug('debug message, not logged if NODE_ENV=production');
log.info('Hi there!');
```

* [ecs-logs-js](#module_ecs-logs-js)
    * [~Levels](#module_ecs-logs-js..Levels)
    * [~Logger([options], [level], [Object[]])](#module_ecs-logs-js..Logger)
    * [~Transport([options])](#module_ecs-logs-js..Transport)
    * [~Formatter([options])](#module_ecs-logs-js..Formatter) ⇒ <code>string</code>
    * [~makeEvent(entry, [hostname])](#module_ecs-logs-js..makeEvent) ⇒ <code>Object</code>
    * [~makeEventError(error)](#module_ecs-logs-js..makeEventError) ⇒ <code>Object</code>
    * [~extractErrors(obj)](#module_ecs-logs-js..extractErrors) ⇒ <code>Array</code>

<a name="module_ecs-logs-js..Levels"></a>

### ecs-logs-js~Levels
Levels maps the winston log levels exposed by the ecslogs.Logger..

**Kind**: inner property of <code>[ecs-logs-js](#module_ecs-logs-js)</code>  
<a name="module_ecs-logs-js..Logger"></a>

### ecs-logs-js~Logger([options], [level], [Object[]])
The Logger type is a winston logger with preconfigured defaults to output
log messages compatible with ecs-logs.

**Kind**: inner method of <code>[ecs-logs-js](#module_ecs-logs-js)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> | The configuration object for the new logger, besides the properties documented here the options object can also carry all properties that the Transport and Formatter constructors accept, they will be passed to the default transport and formatter instantiated if none was given. |
| [level] | <code>string</code> | The minimum level for log messages this logger will pass to its transports, defaults to 'debug' |
| [Object[]] | <code>transports</code> | An array of winston transports that the logger will be passing log messages to, defaults to a single instance of Transport. |

**Example**  
```js
var ecslogs = require('ecs-logs-js');

var log = new ecslogs.Logger({
  level: 'info'
});

log.info('Hi there!');
```
<a name="module_ecs-logs-js..Transport"></a>

### ecs-logs-js~Transport([options])
The Transport type implements a winston log transport preconfigured to
output log messages compatible with ecs-logs.

**Kind**: inner method of <code>[ecs-logs-js](#module_ecs-logs-js)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> | The configuration object for the new transport, besides the properties documented here the options object can also carry all properties that the Formatter constructor accepts, they will be passed to the default formatter instantiated if none was given. |
| [options.name] | <code>string</code> | The transport name, defaults to 'ecs-logs' |
| [options.level] | <code>string</code> | The transport level, defaults to 'debug' messages, this is passed to the default formatter if none was provided |
| [options.output] | <code>function</code> | A function called when the transport has a log message to send, defaults to writing to stdout. |
| [options.timestamp] | <code>function</code> | A function returning timestamps, defaults to Date.now |
| [options.formatter] | <code>Object</code> | A winston formatter, defaults to an instance of Formatter |

**Example**  
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
<a name="module_ecs-logs-js..Formatter"></a>

### ecs-logs-js~Formatter([options]) ⇒ <code>string</code>
The Formatter type implements a winston log formatter that produces messages
compatible with ecs-logs.

The object returned when instantiating the Formatter type is callable. When
called, it expects a log entry object.

**Kind**: inner method of <code>[ecs-logs-js](#module_ecs-logs-js)</code>  
**Returns**: <code>string</code> - When a formatter instance is called it accepts a log entry
as argument and returns a JSON representation of the entry in a format
compatible with ecs-logs  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> | The configuration object for the new formatter |
| [options.hostname] | <code>string</code> | The hostname to report in the log messages, defaults to the value returned by os.hostname() |

**Example**  
```js
var eslogs = require('ecs-logs-js');
var winston = require('winston');

// Instantiate an ecs-logs compatible winston logger with ecslogs.Formatter
var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
        timestamp: Date.now,
        formatter: new ecslogs.Formatter()
      }
    })
  ]
});
```
**Example**  
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
<a name="module_ecs-logs-js..makeEvent"></a>

### ecs-logs-js~makeEvent(entry, [hostname]) ⇒ <code>Object</code>
Given a log entry and an optional hostname the function generates and returns
an ecs-logs event.

**Kind**: inner method of <code>[ecs-logs-js](#module_ecs-logs-js)</code>  
**Returns**: <code>Object</code> - An ecs-logs event generated from the arguments.  

| Param | Type | Description |
| --- | --- | --- |
| entry | <code>Object</code> | A log entry, this is the type of objects received by formatters. |
| [hostname] | <code>string</code> | An optional hostname to set on the event. |

<a name="module_ecs-logs-js..makeEventError"></a>

### ecs-logs-js~makeEventError(error) ⇒ <code>Object</code>
Given an error object, returns an event error as expected in the `info` field
of ecs-logs messages.

**Kind**: inner method of <code>[ecs-logs-js](#module_ecs-logs-js)</code>  
**Returns**: <code>Object</code> - An event error object generated from the argument.  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>Object</code> | The error object to convert. |

<a name="module_ecs-logs-js..extractErrors"></a>

### ecs-logs-js~extractErrors(obj) ⇒ <code>Array</code>
Scans the object passed as argument looking for Error values. The values that
matched are removed from the object and placed in the array returned by the
function.

Only the top-level properties of the object are checked, the function doesn't
search the object recursively.

**Kind**: inner method of <code>[ecs-logs-js](#module_ecs-logs-js)</code>  
**Returns**: <code>Array</code> - The list of errors extracted from the object.  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>Object</code> | The object to extract errors from. |

