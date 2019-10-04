'use strict'

const assert = require('chai').assert
const proxyquire = require('proxyquire')
const sinon = require('sinon')

describe('Documents', () => {
  let Document, mongoose, hooks, methods, toJSON, schema, documentSchema, subDocumentSchema, documentModel

  beforeEach(() => {
    documentModel = {}
    subDocumentSchema = {}
    documentSchema = {
      pre: sinon.spy(),
      post: sinon.spy(),
      methods: sinon.spy()
    }
    mongoose = {
      Schema: sinon.stub().returns(documentSchema),
      model: sinon.stub().returns(documentModel)
    }
    hooks = {
      pre: { save: sinon.spy() },
      post: { save: sinon.spy() }
    }
    methods = {
      custom: sinon.spy()
    }
    toJSON = {
      transform: sinon.spy()
    }
    schema = {
      name: {
        type: String,
        require: true
      },
      metadata: {
        created: {
          type: Date,
          default: Date.now
        },
        updated: {
          type: Date,
          default: Date.now
        }
      },
      content: subDocumentSchema
    }
    Document = proxyquire('../../../../src/db/models/document', {
      'mongoose': mongoose,
      './functions': { hooks, methods, toJSON },
      '../subdocument': subDocumentSchema
    })
  })

  it('should exports mongoose model', () => {
    assert.equal(Document, documentModel)
  })

  it('should create mongoose schema as defined', () => {
    assert(mongoose.Schema.calledWith(schema))
    assert(typeof mongoose.Schema.firstCall.args[1].toJSON, 'function')
  })

  it('should create mongoose model with defined schema', () => {
    assert(mongoose.model.calledWithExactly('Document', documentSchema))
  })

  it('should register middlewares (hooks) as defined', () => {
    let preHooks = Object.keys(hooks.pre)
    let postHooks = Object.keys(hooks.post)

    preHooks.forEach(hook => {
      assert(documentSchema.pre.calledWithExactly(hook, hooks.pre[hook]))
    })
    postHooks.forEach(hook => {
      assert(documentSchema.post.calledWithExactly(hook, hooks.post[hook]))
    })
  })

  it('should register custom methods as defined', () => {
    let customMethods = Object.keys(methods)

    customMethods.forEach(method => {
      assert.deepEqual(documentSchema.methods[method], methods[method])
    })
  })
})