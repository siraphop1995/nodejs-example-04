'use strict'

const assert = require('chai').assert
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

describe('App', () => {
  let app, mongoose, routes, process, datanaExpress, fakeHttpServer = {}

  beforeEach(() => {
    mongoose = {
      Promise: {},
      connect: sinon.spy()
    }
    process = {
      stderr: {
        write: sinon.spy()
      },
      env: {
        MONGO_URL: 'mongodb://host:27017',
        NODE_ENV: 'development',
        PORT: 3000
      }
    }
    datanaExpress = {
      use: sinon.spy(),
      listen: sinon.stub().returns(fakeHttpServer)
    }
    routes = sinon.spy()
    app = proxyquire('../app', {
      'datana-express': datanaExpress,
      'mongoose': mongoose,
      './src': routes,
      'process': process
    })
  })

  afterEach(() => {
    delete process.env.PORT
    delete process.env.NODE_ENV
  })

  it('should set mongoose promise engine to bluebird', () => {
    let bluebird = require('bluebird')
    assert.deepEqual(mongoose.Promise, bluebird)
  })

  it('should have start() function', () => {
    assert.isOk(app.start)
    assert.equal(typeof app.start, 'function')
  })

  describe('start()', () => {
    it('should return HTTP server', () => {
      assert.equal(app.start(), fakeHttpServer)
    })

    it('should start HTTP server with default port', () => {
      delete process.env.PORT // force to use DEFAULT_PORT
      app.start()
      assert(datanaExpress.listen.calledWith(3000))
    })

    it('should start HTTP server with process.env.PORT', () => {
      process.env.PORT = 8080
      app.start()
      assert(datanaExpress.listen.calledWith(process.env.PORT))
    })

    it('should connect to MongoDB via defined URL', () => {
      app.start()
      assert(mongoose.connect.calledWith(process.env.MONGO_URL))
    })
  })

  describe('Middleware', () => {
    beforeEach(() => app.start())

    it('should route all request to external route handler', () => {
      assert(datanaExpress.use.calledWithExactly('/', routes))
    })
  })
})
