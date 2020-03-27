/* eslint-disable @typescript-eslint/no-explicit-any */
import { advanceTo } from 'jest-date-mock'
import Logger from '../src'

advanceTo('2019-01-01T00:00:00.000Z')

test('can log a message', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.log('info', 'test')

  expect(spy).toHaveBeenCalledWith(`{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test"}\n`)
})

test('allows the log level to be limited', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger({ level: 'error' })
  logger.log('info', 'test')

  expect(spy).not.toHaveBeenCalled()
})

test('validates the level', () => {
  expect(() => {
    new Logger({ level: 'derp' })
  }).toThrowErrorMatchingInlineSnapshot(`"Invalid log level 'derp'"`)
})

test('can log data', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.log('info', 'test', { some: 'data' })

  expect(spy).toHaveBeenCalledWith(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"some":"data"}}\n`
  )
})

test('handles circular references', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const fixture1: any = {}
  const fixture2: any = { fixture1 }
  fixture1.fixture2 = fixture2

  const logger = new Logger()
  logger.log('info', 'test', fixture1)

  expect(spy).toHaveBeenCalledWith(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"fixture2":{"fixture1":"[Circular]"}}}\n`
  )
})

test('handles Buffers', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.log('info', 'test', { buffer: Buffer.alloc(2) })

  expect(spy).toHaveBeenCalledWith(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"buffer":{"type":"Buffer","data":[0,0]}}}\n`
  )
})

test('handles BigInts', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.log('info', 'test', { bigint: BigInt('999999999999999999999') })

  expect(spy).toHaveBeenCalledWith(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"bigint":"999999999999999999999"}}\n`
  )
})

test('handles Maps', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.log('info', 'test', { map: new Map([['test', 'map']]) })

  expect(spy).toHaveBeenCalledWith(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"map":[["test","map"]]}}\n`
  )
})

test('handles Sets', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.log('info', 'test', { set: new Set(['test']) })

  expect(spy).toHaveBeenCalledWith(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"set":["test"]}}\n`
  )
})

test('handles Errors', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.log('info', 'test', { error: new Error('Request timeout') })

  expect(spy).toHaveBeenCalled()
  const log = JSON.parse(spy.mock.calls[0][0])
  expect(log).toMatchObject({
    data: {
      error: {
        message: 'Request timeout',
        name: 'Error',
      },
    },
    level: 'INFO',
    message: 'test',
    time: '2019-01-01T00:00:00.000Z',
  })
  expect(Array.isArray(log.data.error.stack)).toBeTruthy()
})

test('handles Errors at the top level', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.log('info', 'test', new Error('Request timeout'))

  expect(spy).toHaveBeenCalled()
  const log = JSON.parse(spy.mock.calls[0][0])
  expect(log).toMatchObject({
    data: {
      message: 'Request timeout',
      name: 'Error',
    },
    level: 'INFO',
    message: 'test',
    time: '2019-01-01T00:00:00.000Z',
  })
})

test('logs additional properties on Errors', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  const error: any = new Error('Request timeout')
  error.serviceName = 'test'
  logger.log('info', 'test', { error })

  expect(spy).toHaveBeenCalled()
  const log = JSON.parse(spy.mock.calls[0][0])
  expect(log).toHaveProperty('data.error.serviceName')
})

test('devMode: can log a message', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger({ devMode: true })
  logger.log('info', 'test')

  expect(spy).toHaveBeenCalled()
  expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
    "[1m[22m
    [1mINFO: test[22m
    "
  `)
})

test('info alias can log data', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.info('test', { some: 'data' })

  expect(spy).toHaveBeenCalledWith(
    `{"level":"INFO","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"some":"data"}}\n`
  )
})

test('error alias can log data', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger()
  logger.error('test', { some: 'data' })

  expect(spy).toHaveBeenCalledWith(
    `{"level":"ERROR","time":"2019-01-01T00:00:00.000Z","message":"test","data":{"some":"data"}}\n`
  )
})

test('devMode: can log data', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger({ devMode: true })
  logger.log('info', 'test', { some: 'data', nested: { buffer: Buffer.alloc(2) } })

  expect(spy).toHaveBeenCalled()
  expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
    "[1m[22m
    [1mINFO: test[22m
      some: data
      nested:
        buffer:
          type: Buffer
          data:
            - 0
            - 0
    "
  `)
})

test('devMode: colors warn level yellow', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger({ devMode: true })
  logger.log('warn', 'test')

  expect(spy).toHaveBeenCalled()
  expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
    "[33m[1m[22m[39m
    [33m[1mWARN: test[22m[39m
    "
  `)
})

test('devMode: colors error level red', () => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation()

  const logger = new Logger({ devMode: true })
  logger.log('error', 'test1')
  logger.log('crit', 'test2')

  expect(spy).toBeCalledTimes(2)
  expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
    "[31m[1m[22m[39m
    [31m[1mERROR: test1[22m[39m
    "
  `)
  expect(spy.mock.calls[1][0]).toMatchInlineSnapshot(`
    "[31m[1m[22m[39m
    [31m[1mCRIT: test2[22m[39m
    "
  `)
})
