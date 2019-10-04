'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

describe('Datana Authorization', () => {
  let Authorizor, request

  beforeEach(() => {
    request = sinon.stub()
    Authorizor = proxyquire('../src/utils/authorizor', { 'request': request })
  })

  it('should export correctly', () => {
    assert.equal(typeof new Authorizor(), 'object')
  })

  it('should set apiConfig to {} when not provided', () => {
    const authorizor = new Authorizor()
    assert.deepEqual(authorizor.apiConfig, {})
  })

  it('should save apiConfig when pass to constructor', () => {
    const apiConfig = {
      'GET /login': {}
    }
    const authorizor = new Authorizor(apiConfig)
    assert.deepEqual(authorizor.apiConfig, apiConfig)
  })

  it('should save config when pass to constructor', () => {
    const config = {
      authenticationServer: 'http://localhost:3000'
    }
    const authorizor = new Authorizor(null, config)
    assert.deepEqual(authorizor.config, config)
  })

  it('should have _constructPath()', () => {
    const authorizor = new Authorizor()
    assert(authorizor._constructPath)
    assert.equal(typeof authorizor._constructPath, 'function')
  })

  it('should have _performAuthenticationAndAuthorization()', () => {
    const authorizor = new Authorizor()
    assert(authorizor._performAuthenticationAndAuthorization)
    assert.equal(typeof authorizor._performAuthenticationAndAuthorization, 'function')
  })

  it('should have _performAuthorization()', () => {
    const authorizor = new Authorizor()
    assert(authorizor._performAuthorization)
    assert.equal(typeof authorizor._performAuthorization, 'function')
  })

  it('should have authorize()', () => {
    const authorizor = new Authorizor()
    assert(authorizor.authorize)
    assert.equal(typeof authorizor.authorize, 'function')
  })

  describe('_constructPath()', () => {
    let authorizor

    beforeEach(() => {
      authorizor = new Authorizor()
    })

    it('should receieve 1 parameter', () => {
      assert.equal(authorizor._constructPath.length, 1)
    })

    it('should return correct path string', () => {
      const req = {
        method: 'GET',
        route: {
          path: '/login'
        },
      }
      const path = authorizor._constructPath(req)
      const expectedPath = 'GET /login'
      assert.equal(path, expectedPath)
    })

    it('should return correct path string', () => {
      const req = {
        method: 'POST',
        route: {
          path: '/user/signup'
        },
      }
      const path = authorizor._constructPath(req)
      const expectedPath = 'POST /user/signup'
      assert.equal(path, expectedPath)
    })
  })

  describe('_verifyToken()', () => {

    let req, token, authorizor

    beforeEach(() => {
      token = 'Bearer xxxx'
      authorizor = new Authorizor()
      req = { headers: { authorization: token } }
    })

    it('should get token from headers', () => {
      authorizor._verifyToken(req)
      assert.equal(req.headers.authorization, token)
    })

    it('should get token from cookies if not exits in headers', () => {
      req = {
        headers: {},
        cookies: { authorization: token }
      }
      authorizor._verifyToken(req)
      assert.equal(req.headers.authorization, token)
    })

  })

  describe('_performAuthenticationAndAuthorization()', () => {
    let authorizor, config, req

    beforeEach(() => {
      req = {
        headers: {
          authorization: 'Bearer xxxx'
        }
      }
      config = {
        authenticationServer: 'http://localhost:3000'
      }
      authorizor = new Authorizor(null, config)
    })

    it('should receieve 4 parameter', () => {
      assert.equal(authorizor._performAuthenticationAndAuthorization.length, 4)
    })

    it('should send request to authentication server', () => {
      const expectedOptions = {
        url: config.authenticationServer,
        headers: {
          Authorization: req.headers.authorization
        }
      }
      authorizor._performAuthenticationAndAuthorization(null, req, null, null)
      assert.deepEqual(request.args[0][0], expectedOptions)
    })

    it('should send 504 internal server error when request error', () => {
      const res = {
        sendStatus: sinon.spy()
      }
      request.yields({ error: 'error' }, null, null)
      authorizor._performAuthenticationAndAuthorization(null, req, res, null)
      assert.equal(res.sendStatus.args[0][0], 504)
    })

    it('should set req.user if status code is 200', () => {
      const _performAuthorizationSpy = sinon.stub(
        Authorizor.prototype,
        '_performAuthorization'
      )
      request.yields(
        null,
        { statusCode: 200 },
        '{"user": "user"}'
      )
      const res = {
        sendStatus: sinon.spy()
      }
      const next = sinon.spy()
      const pathConfig = { roles: 'user' }
      authorizor._performAuthenticationAndAuthorization(pathConfig, req, res, next)
      assert.deepEqual(req.user, { user: 'user' })
      assert.deepEqual(_performAuthorizationSpy.args[0], [
        pathConfig,
        req,
        res,
        next,
      ])
    })

    it('should send error message if authentication failed', () => {
      const res = {
        status: sinon.spy(),
        json: sinon.spy(),
      }
      request.yields(
        null,
        { statusCode: 401 },
        '{"error": "authentication failed"}'
      )
      authorizor._performAuthenticationAndAuthorization(null, req, res, null)
      assert.deepEqual(res.status.args[0][0], 401)
      assert.deepEqual(res.json.args[0][0], { error: 'authentication failed' })
    })
  })

  describe('_performAuthorization()', () => {
    let authorizor, config, req

    beforeEach(() => {
      req = {
        headers: {
          authorization: 'Bearer xxxx'
        }
      }
      config = {
        authenticationServer: 'http://localhost:3000'
      }
      authorizor = new Authorizor(null, config)
    })

    it('should receieve 4 parameter', () => {
      assert.equal(authorizor._performAuthorization.length, 4)
    })

    it('should send 403 if user does not have roles object', () => {
      const pathConfig = {
        roles: ['super_admin']
      }
      const req = {
        user: {
          app_metadata: {}
        }
      }
      const res = {
        status: sinon.spy(),
        json: sinon.spy(),
      }
      const expectedJson = {
        error: {
          code: 403,
          status: 'FORBIDDEN',
          message: 'User does not have permission to access this resource.',
        }
      }
      authorizor._performAuthorization(pathConfig, req, res)
      assert.equal(res.status.args[0][0], 403)
      assert.deepEqual(res.json.args[0][0], expectedJson)
    })

    it('should call next if user have permission', () => {
      const pathConfig = {
        roles: ['user']
      }
      const req = {
        user: {
          app_metadata: {
            roles: ['user', 'admin']
          }
        }
      }
      const res = {
        status: sinon.spy(),
        json: sinon.spy(),
      }
      const next = sinon.spy()
      authorizor._performAuthorization(pathConfig, req, res, next)
      assert(!res.status.called)
      assert(!res.json.called)
    })

    it('should send 403 if user does not have permission', () => {
      const pathConfig = {
        roles: ['super_admin']
      }
      const req = {
        user: {
          app_metadata: {
            roles: ['user', 'admin']
          }
        }
      }
      const res = {
        status: sinon.spy(),
        json: sinon.spy(),
      }
      const expectedJson = {
        error: {
          code: 403,
          status: 'FORBIDDEN',
          message: 'User does not have permission to access this resource.',
        }
      }
      authorizor._performAuthorization(pathConfig, req, res)
      assert.equal(res.status.args[0][0], 403)
      assert.deepEqual(res.json.args[0][0], expectedJson)
    })
  })

  describe('authorize()', () => {
    it('should return an express middleware', () => {
      const authorizor = new Authorizor()
      const middleware = authorizor.authorize()
      assert.equal(typeof middleware, 'function')
      assert.equal(middleware.length, 3)
    })
  })

  describe('middleware', () => {
    let authorizor, apiConfig, middleware

    beforeEach(() => {
      apiConfig = {
        'POST /': {
        },
        'POST /signup': {
          roles: []
        },
        'GET /login': {
          roles: ['user']
        },
      }
      authorizor = new Authorizor(apiConfig)
      middleware = authorizor.authorize()
    })

    it('should call next() when route is not in apiConfig', () => {
      const nextSpy = sinon.spy()
      const req = {
        method: 'XXX',
        route: {
          path: '/xxx'
        },
      }
      middleware(req, null, nextSpy)
      assert(nextSpy.called)
    })

    it("should call next() when route's roles in not defined", () => {
      const nextSpy = sinon.spy()
      const req = {
        method: 'POST',
        route: {
          path: '/'
        },
      }
      middleware(req, null, nextSpy)
      assert(nextSpy.called)
    })

    it("should call next() when route's roles is an empty array", () => {
      const nextSpy = sinon.spy()
      const req = {
        method: 'POST',
        route: {
          path: '/signup',
        },
      }
      middleware(req, null, nextSpy)
      assert(nextSpy.called)
    })

    it("should perform authentication and authorization when route's roles is defined", () => {
      const _performAuthenticationSpy = sinon.stub(
        Authorizor.prototype,
        '_performAuthenticationAndAuthorization'
      )
      const _performAuthorizationSpy = sinon.stub(
        Authorizor.prototype,
        '_performAuthorization'
      )
      const _verifyToken = sinon.stub(
        Authorizor.prototype,
        '_verifyToken'
      )
      const nextSpy = sinon.spy()
      const resSpy = sinon.spy()
      const req = {
        method: 'GET',
        route: {
          path: '/login'
        },
      }
      middleware(req, resSpy, nextSpy)
      assert(_performAuthenticationSpy.called)
      assert(_verifyToken.called)
      assert.equal(_verifyToken.args[0][0], req)
      assert.equal(_performAuthenticationSpy.args[0][0], apiConfig['GET /login'])
      assert.equal(_performAuthenticationSpy.args[0][1], req)
      assert.equal(_performAuthenticationSpy.args[0][2], resSpy)
      assert.equal(_performAuthenticationSpy.args[0][3], nextSpy)
      _performAuthenticationSpy.restore()
      _performAuthorizationSpy.restore()
      _verifyToken.restore()
    })
  })
})
