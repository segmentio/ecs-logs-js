/* eslint-disable @typescript-eslint/no-explicit-any */
import { advanceTo } from 'jest-date-mock'
import { Logger, LEVEL, formatLogLine, LogLine } from '../src'

advanceTo('2019-01-01T00:00:00.000Z')

// Helper to capture log output using the writer option
function createCaptureLogger(options: { level?: LEVEL; devMode?: boolean } = {}) {
  const output: string[] = []
  const logger = new Logger({
    ...options,
    writer: (s) => output.push(s),
  })
  return { logger, output }
}

test('can log a message', () => {
  const { logger, output } = createCaptureLogger()
  logger.log('info', 'test')

  expect(output[0]).toBe(`{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test"}`)
})

test('allows the log level to be limited', () => {
  const { logger, output } = createCaptureLogger({ level: 'error' })
  logger.log('info', 'test')

  expect(output).toHaveLength(0)
})

test('validates the level', () => {
  expect(() => {
    new Logger({ level: 'derp' as LEVEL })
  }).toThrowErrorMatchingInlineSnapshot(`"Invalid log level 'derp'"`)
})

test('can log data', () => {
  const { logger, output } = createCaptureLogger()
  logger.log('info', 'test', { some: 'data' })

  expect(output[0]).toBe(`{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"some":"data"}}`)
})

interface fixture1 {
  fixture2?: any
}

test('handles circular references', () => {
  const { logger, output } = createCaptureLogger()

  const fixture1: fixture1 = {}
  const fixture2: object = { fixture1 }
  fixture1.fixture2 = fixture2

  logger.log('info', 'test', fixture1)

  expect(output[0]).toBe(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"fixture2":{"fixture1":"[Circular]"}}}`
  )
})

test('handles Buffers', () => {
  const { logger, output } = createCaptureLogger()
  logger.log('info', 'test', { buffer: Buffer.alloc(2) })

  expect(output[0]).toBe(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"buffer":{"type":"Buffer","data":[0,0]}}}`
  )
})

test('handles BigInts', () => {
  const { logger, output } = createCaptureLogger()
  logger.log('info', 'test', { bigint: BigInt('999999999999999999999') })

  expect(output[0]).toBe(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"bigint":"999999999999999999999"}}`
  )
})

test('handles Maps', () => {
  const { logger, output } = createCaptureLogger()
  logger.log('info', 'test', { map: new Map([['test', 'map']]) })

  expect(output[0]).toBe(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"map":[["test","map"]]}}`
  )
})

test('handles Sets', () => {
  const { logger, output } = createCaptureLogger()
  logger.log('info', 'test', { set: new Set(['test']) })

  expect(output[0]).toBe(`{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"set":["test"]}}`)
})

interface dataError {
  data: {
    error: {
      message: string
      name: string
      stack: string[]
    }
  }
}

test('handles Errors', () => {
  const { logger, output } = createCaptureLogger()
  logger.log('info', 'test', { error: new Error('Request timeout') })

  expect(output).toHaveLength(1)
  const log: dataError = JSON.parse(output[0]) as dataError
  expect(log).toMatchObject({
    data: {
      error: {
        message: 'Request timeout',
        name: 'ErrorArrayStack',
      },
    },
    level: 'INFO',
    message: 'test',
    time: '2019-01-01T00:00:00.000Z',
  })
  expect(Array.isArray(log.data.error.stack)).toBeTruthy()
})

test('handles Errors at the top level', () => {
  const { logger, output } = createCaptureLogger()
  logger.log('info', 'test', new Error('Request timeout'))

  expect(output).toHaveLength(1)
  const log: dataError = JSON.parse(output[0]) as dataError
  expect(log).toMatchObject({
    data: {
      message: 'Request timeout',
      name: 'ErrorArrayStack',
    },
    level: 'INFO',
    message: 'test',
    time: '2019-01-01T00:00:00.000Z',
  })
})

class CustomError extends Error {
  serviceName?: string
}

test('logs additional properties on Errors', () => {
  const { logger, output } = createCaptureLogger()
  const error: CustomError = new Error('Request timeout')
  error.serviceName = 'test'
  logger.log('info', 'test', { error })

  expect(output).toHaveLength(1)
  const log: dataError = JSON.parse(output[0]) as dataError
  expect(log).toHaveProperty('data.error.serviceName')
})

test('devMode: can log a message', () => {
  const { logger, output } = createCaptureLogger({ devMode: true })
  logger.log('info', 'test')

  expect(output).toHaveLength(1)
  expect(output[0]).toMatchInlineSnapshot(`
    "[1m[22m
    [1mINFO: test[22m"
  `)
})

test('info alias can log data', () => {
  const { logger, output } = createCaptureLogger()
  logger.info('test', { some: 'data' })

  expect(output[0]).toBe(`{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"some":"data"}}`)
})

test('error alias can log data', () => {
  const { logger, output } = createCaptureLogger()
  logger.error('test', { some: 'data' })

  expect(output[0]).toBe(`{"level":"ERROR","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"some":"data"}}`)
})

test('devMode: can log data', () => {
  const { logger, output } = createCaptureLogger({ devMode: true })
  logger.log('info', 'test', { some: 'data', nested: { buffer: Buffer.alloc(2) } })

  expect(output).toHaveLength(1)
  expect(output[0]).toMatchInlineSnapshot(`
    "[1m[22m
    [1mINFO: test[22m
      some: data
      nested:
        buffer:
          type: Buffer
          data:
            - 0
            - 0"
  `)
})

test('devMode: colors warn level yellow', () => {
  const { logger, output } = createCaptureLogger({ devMode: true })
  logger.log('warn', 'test')

  expect(output).toHaveLength(1)
  expect(output[0]).toMatchInlineSnapshot(`
    "[33m[1m[22m[39m
    [33m[1mWARN: test[22m[39m"
  `)
})

test('devMode: colors error level red', () => {
  const { logger, output } = createCaptureLogger({ devMode: true })
  logger.log('error', 'test1')
  logger.log('crit', 'test2')

  expect(output).toHaveLength(2)
  expect(output[0]).toMatchInlineSnapshot(`
    "[31m[1m[22m[39m
    [31m[1mERROR: test1[22m[39m"
  `)
  expect(output[1]).toMatchInlineSnapshot(`
    "[31m[1m[22m[39m
    [31m[1mCRIT: test2[22m[39m"
  `)
})

// Tests for the new formatLogLine pure function
describe('formatLogLine', () => {
  test('formats a basic log line as JSON', () => {
    const logLine: LogLine = {
      level: 'INFO',
      time: '2019-01-01T00:00:00.000Z',
      message: 'test message',
    }

    const result = formatLogLine(logLine, false)
    expect(result).toBe('{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test message"}')
  })

  test('formats a log line with data as JSON', () => {
    const logLine: LogLine = {
      level: 'INFO',
      time: '2019-01-01T00:00:00.000Z',
      message: 'test message',
      data: { foo: 'bar' },
    }

    const result = formatLogLine(logLine, false)
    expect(result).toBe(
      '{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test message","data":{"foo":"bar"}}'
    )
  })

  test('formats a log line in dev mode', () => {
    const logLine: LogLine = {
      level: 'INFO',
      time: '2019-01-01T00:00:00.000Z',
      message: 'test message',
    }

    const result = formatLogLine(logLine, true)
    expect(result).toContain('INFO: test message')
  })

  test('handles BigInt in data', () => {
    const logLine: LogLine = {
      level: 'INFO',
      time: '2019-01-01T00:00:00.000Z',
      message: 'test',
      data: { bigint: BigInt('12345678901234567890') },
    }

    const result = formatLogLine(logLine, false)
    expect(result).toContain('"bigint":"12345678901234567890"')
  })
})

// Test that default writer still works (backwards compatibility)
test('defaults to stdout when no writer provided', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.log('info', 'test')

  expect(spy).toHaveBeenCalledWith(`{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test"}\n`)
  spy.mockRestore()
})
