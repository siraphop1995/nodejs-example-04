'use strict'

const request = require('request')

class Authorizor {

  constructor (apiConfig={}, config={}) {
    this.apiConfig = apiConfig
    this.config = config
    this.errorBody = {
      error: {
        code: 403,
        status: 'FORBIDDEN',
        message: 'User does not have permission to access this resource.'
      }
    }
  }

  _constructPath (req) {
    return `${req.method} ${req.route.path}`
  }

  _verifyToken (req) {
    if (!req.headers.authorization) req.headers.authorization = req.cookies.authorization
  }

  _performAuthenticationAndAuthorization (pathConfig, req, res, next) {
    const options = {
      url: this.config.authenticationServer,
      headers: {
        Authorization: req.headers.authorization
      }
    }
    request(options, (err, authRes, authResult) => {
      if (err) {
        res.sendStatus(504)
      } else {
        if (authRes.statusCode === 200) {
          req.user = JSON.parse(authResult)
          this._performAuthorization(pathConfig, req, res, next)
        } else {
          res.status(authRes.statusCode)
          res.json(JSON.parse(authResult))
        }
      }
    })
  }

  _performAuthorization (pathConfig, req, res, next) {
    if (req.user.app_metadata.roles) {
      const isAllow = req.user.app_metadata.roles.map(role => {
        return pathConfig.roles.indexOf(role) !== -1
      }).reduce((a,b) => a || b, false)
      if (!isAllow) {
        res.status(403)
        res.json(this.errorBody)
      } else {
        next()
      }
    } else {
      res.status(403)
      res.json(this.errorBody)
    }
  }

  authorize() {
    return (req, res, next) => {
      const path = this._constructPath(req)
      const pathConfig = this.apiConfig[path]
      if (pathConfig && pathConfig.roles && pathConfig.roles.length > 0) {
        this._verifyToken(req)
        this._performAuthenticationAndAuthorization(pathConfig, req, res, next)
      } else {
        next()
      }
    }
  }
}

module.exports = Authorizor
