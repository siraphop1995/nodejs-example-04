'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

describe('ErrorHandler', () => {
  let res, errorHandler

  beforeEach(() => {
    errorHandler = require('../../../src/utils/errorHandler.js')
    res = {
      json: sinon.spy(),
      status: sinon.stub(),
    }
    res.status.returns(res)
  })

  it('should send 404 when theres is a CastError', () => {
    const err = { name: 'CastError' }
    errorHandler(err, undefined, res, undefined)
    assert.equal(res.status.args[0][0], 404)
  })

  it('should send 400 when there is a MongoError for duplicate index', () => {
    const err = { name: 'MongoError' }
    errorHandler(err ,undefined, res, undefined)
    assert.equal(res.status.args[0][0], 400)
  })

  it('should set status equal to err.status', () => {
    const err = { status: 418 }
    errorHandler(err, undefined, res, undefined)
    assert.equal(res.status.args[0][0], 418)
  })

  it('should set status to 500 when err.status is not provided', () => {
    errorHandler(undefined, undefined, res, undefined)
    assert.equal(res.status.args[0][0], 500)
  })

  it('should set appropriate response when recieve an error', () => {
    const err = {
      status: 200,
      code: 'err_code',
      message: 'err_msg',
    }
    errorHandler(err, undefined, res, undefined)
    assert.deepEqual(res.json.args[0][0], {
      error: {
        code: 200,
        message: 'err_msg',
        status: 'OK',
      }
    })
  })

  it('should set appropriate response when recieve an error', () => {
    const err = {
      status: 401,
      code: 'err_code',
      message: 'err_msg',
    }
    errorHandler(err, undefined, res, undefined)
    assert.deepEqual(res.json.args[0][0], {
      error: {
        code: 401,
        message: 'err_msg',
        status: 'UNAUTHORIZED',
      }
    })
  })

  it('should set appropriate response when receive an error', () => {
    // google cloud use this syntax to express API error
    const err = {
      code: 400,
      message: 'err_msg'
    }
    errorHandler(err, undefined, res, undefined)
    assert.deepEqual(res.json.args[0][0], {
      error: {
        code: 400,
        message: 'err_msg',
        status: 'BAD_REQUEST'
      }
    })
  })

  it('should set appropriate response when receive an error', () => {
    // error from another service
    const err = {
      code: 404,
      status: 'NOT_FOUND',
      message: 'Not found'
    }
    errorHandler(err, undefined, res, undefined)
    assert.deepEqual(res.json.args[0][0], {
      error: err
    })
  })
})
