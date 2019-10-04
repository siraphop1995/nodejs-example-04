'use strict'

const assert = require('chai').assert
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const MIDDLEWARE_POS = 1
const AUTHORIZOR_POS = 0
const VALIDATOR_POS = 1

describe('Loader', () => {
  let loader, loaderFunction, router, routes, methods, routeIndex, process
  let validator, Validator, ValidatorClass = {}
  let authorizor, Authorizor, AuthorizorClass = {}

  before(() => {
    process = {
      env: {
        AUTH_SERVER: 'http://localhost:3000'
      }
    }
    validator = {
      validate: sinon.stub().returns(sinon.stub()) // function that returns callback
    }
    authorizor = {
      authorize: sinon.stub().returns(sinon.stub()) // function that returns callback
    }
    routeIndex = sinon.spy()
    Validator = sinon.stub(ValidatorClass, 'constructor').returns(validator)
    Authorizor = sinon.stub(AuthorizorClass, 'constructor').returns(authorizor)
    loaderFunction = proxyquire('../../../src/routes/loader', {
      process,
      './index': routeIndex,
      'datana-request-validator': Validator,
      'datana-authorization': Authorizor,
    })
  })

  it('should initiate validator correctly', () => {
    assert.deepEqual(Validator.args[0][0], routeIndex)
  })

  it('should initiate authorizor correctly', () => {
    assert.deepEqual(Authorizor.args[0][0], routeIndex)
    assert.deepEqual(Authorizor.args[0][1], {
      authenticationServer: 'http://localhost:3000'
    })
  })

  it('should export an anonymous function that accepts 3 arguments', () => {
    assert.equal(typeof loaderFunction, 'function')
    assert.equal(loaderFunction.length, 3)
  })

  it('should return an object with subscribeRoute() when invoked', () => {
    loader = loaderFunction()

    assert.equal(typeof loader, 'object')
    assert(loader.subscribeRoute)
  })

  describe('subscribeRoute()', () => {
    let getSpy

    before(() => {
      routes = {
        'GET /multiple': { middlewares: ['first', 'second', 'third'] },
        'GET /none': { middlewares: [] },
        'GET /undefined': {},
      }
      methods = {
        first: sinon.stub().returns('first'),
        second: sinon.stub().returns('second'),
        third: sinon.stub().returns('third'),
        fourth: sinon.stub().returns('fourth')
      }
      router = {
        get: sinon.spy()
      }

      loader = loaderFunction(router, routes, methods)
    })

    it('should be a function that accepts 1 argument', () => {
      assert.equal(typeof loader.subscribeRoute, 'function')
      assert.equal(loader.subscribeRoute.length, 1)
    })

    it('should subscribe request validator to every routes', () => {
      let routeNames = Object.keys(routes)
      for (let i = 0; i < routeNames.length; i++) {
        loader.subscribeRoute(routeNames[i])

        assert.deepEqual(router.get.args[i][MIDDLEWARE_POS][VALIDATOR_POS], validator.validate())
      }
    })

    it('should subscribe request authorizor to every routes', () => {
      let routeNames = Object.keys(routes)
      for (let i = 0; i < routeNames.length; i++) {
        loader.subscribeRoute(routeNames[i])

        assert.deepEqual(router.get.args[i][MIDDLEWARE_POS][AUTHORIZOR_POS], authorizor.authorize())
      }
    })

    it('should subscribe all associated middlewares only to a given route', () => {
      let route = 'GET /multiple' // verb = get, uri = /multiple
      let methodChain = [
        authorizor.authorize(),
        validator.validate(),
        methods.first,
        methods.second,
        methods.third
      ]
      let falseMethodChain = methodChain.concat([ methods.fourth ])
      loader.subscribeRoute(route)

      assert(router.get.calledWith('/multiple', methodChain))
      assert.isNotOk(router.get.calledWith('/multiple', falseMethodChain))
    })

    it('should use default config', () => {
      let route = 'GET /undefined'
      loader.subscribeRoute(route)
      assert(router.get.calledWith('/undefined', [authorizor.authorize(), validator.validate()]))
    })

  })

})
