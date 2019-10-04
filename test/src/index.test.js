'use strict'

const assert = require('chai').assert
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

describe('Router', () => {
  let router, routes, methods, loaderFake, subscribeRouteSpy

  beforeEach(() => {
    // set dependencies stub
    routes = {
      'GET /': { middlewares: ['get'] },
      'POST /': { middlewares: ['post'] },
      'PUT /:id': { middlewares: ['put'] },
      'PATCH /:id': { middlewares: ['patch'] },
      'DELETE /:id': { middlewares: ['delete'] }
    }
    methods = {
      get: sinon.stub().returns('get'),
      post: sinon.stub().returns('post'),
      put: sinon.stub().returns('put'),
      patch: sinon.stub().returns('patch'),
      delete: sinon.stub().returns('delete'),
    }

    // set spy for a returned function from route loader
    subscribeRouteSpy = sinon.spy()
    loaderFake = sinon.stub().returns({
      subscribeRoute: subscribeRouteSpy
    })

    // initialize router
    router = proxyquire('../../src/index', {
      './routes': routes,
      './apis': methods,
      './routes/loader': loaderFake,
    })
  })

  it('should export express router', () => {
    assert.isOk(router)
    assert(typeof router, 'function')
  })

  it('should call loader.subscribeRoute() as many time as the number of routes', () => {
    let routeCount = Object.keys(routes).length
    assert.equal(subscribeRouteSpy.callCount, routeCount)
  })
})
