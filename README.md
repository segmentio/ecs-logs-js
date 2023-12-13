# ecs-logs-js

> **Note**
>
> While this project remains available under its open source license for anyone
> to use, we are not actively maintaining it, so issues and pull requests may be
> ignored.

A simple Node.js console logger that outputs human friendly messages in
development and [ecs-logs](https://github.com/segmentio/ecs-logs) compatible
messages in production. Supports all of Node's primitive data types, including
those that can't be JSON stringified like Error, Map, Set and BigInt.

TypeScript types are also included in the package.

<img src="./example.png" alt="Development log output example" width="713" />

## Install

```shell
yarn add ecs-logs-js
# or
npm install ecs-logs-js
```

## Usage

```js
import { Logger } from 'ecs-logs-js'

const logger = new Logger({ devMode: true })
logger.info('Server started at http://localhost:8000')
logger.warn('Request rate limited', { ip: '127.0.0.1' })
logger.error('🚨 Unexpected Error', new Error('Failed to connect to Postgress'))
```

Will log these fields at the top level:

- `time`: a RFC3339 timestamp
- `level`: the log level
- `message`: the log message
- `data`: an object containing any additional fields that have been logged.

For example:

```javascript
logger.info("test", {some: 'data'})
{
    "level":"INFO",
    "time":"2019-01-01T00:00:00.000Z",
    "message":"test",
    "data": {
        "some":"data"
    }
}
```

## API

### new Logger(options?)

Creates a new logger instance.

#### options

Type: `object`

##### level

Type: `'emerg' | 'alert' | 'crit' | 'error' | 'warn' | 'notice' | 'info' | 'debug'`<br />
Default: `'debug'`

Sets the maximum log level that will be output. By setting this option to 'info', it can be used to disable debug logs in production.

##### devMode

Type: `boolean`<br />
Default: `process.env.NODE_ENV === 'development'`

Enables the human friendly development output.

### logger.log(level, message, data?)

Logs a message at the given log level.

#### level

Type: `'emerg' | 'alert' | 'crit' | 'error' | 'warn' | 'notice' | 'info' | 'debug'`

Log level for the message.

#### message

Type: `string`

The message to log.

#### data

Type: `any`

Any additional data to log with the message. This can be any type.

### logger.emerg(message, data?)

### logger.alert(message, data?)

### logger.crit(message, data?)

### logger.error(message, data?)

### logger.warn(message, data?)

### logger.notice(message, data?)

### logger.info(message, data?)

### logger.debug(message, data?)

Logs a message at the respective log level.

#### message

Type: `string`

The message to log.

#### data

Type: `any`

Any additional data to log with the message. This can be any type.

## Development

Make sure you have [Node >=10](https://nodejs.org) and [Yarn](https://classic.yarnpkg.com/en/docs/install) installed, and then run `yarn install` to install the development dependencies.

To run the tests use `yarn test`. To run the tests in watch mode use `yarn test --watch`.

To lint the files use `yarn lint`.

To compile the TypeScript files use `yarn build`.

Note, we deliberately do not have a "yarn.lock" file because this package is
a library and should (hopefully) work with a wide range of dependencies.
