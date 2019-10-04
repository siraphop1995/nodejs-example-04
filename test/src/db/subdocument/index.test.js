'use strict'

const assert = require('chai').assert
const proxyquire = require('proxyquire')
const sinon = require('sinon')

describe('SubDocuments', () => {
  let SubDocument, mongoose, schema, subDocumentSchema

  beforeEach(() => {
    subDocumentSchema = {}
    mongoose = {
      Schema: sinon.stub().returns(subDocumentSchema)
    }
    schema = {
      key: String,
      number: Number,
      boolean: Boolean
    }
    SubDocument = proxyquire('../../../../src/db/models/subdocument', {
      'mongoose': mongoose
    })
  })

  it('should export mongoose schema', () => {
    assert.equal(SubDocument, subDocumentSchema)
  })

  it('should create mongoose schema as defined', () => {
    assert(mongoose.Schema.calledWithExactly(schema))
  })
})