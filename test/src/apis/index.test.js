'use strict'

const assert = require('chai').assert
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

describe('APIs', () => {
  const CALLBACK_POS = 0
  let apis, req, res, next, lodash, Document, query, err, documents, response

  beforeEach(() => {
    req = {
      params: { _id: '1' },
      body: {}
    }
    res = {
      json: sinon.spy(),
      status: sinon.stub(),
      sendStatus: sinon.stub()
    }
    res.status.returns(res) // make res.status() chainable
    next = sinon.stub()

    err = new Error('An error has occurred')
    documents = [
      { _id: '1', f: 'x', save: sinon.stub(), remove: sinon.stub() },
      { _id: '2', f: 'x' },
      { _id: '3', f: 'x' }
    ]

    lodash = {
      merge: sinon.stub()
    },
    query = {
      exec: sinon.stub()
    }
    Document = {
      create: sinon.stub(),
      find: sinon.stub().returns(query),
      findOne: sinon.stub().returns(query),
      findOneAndRemove: sinon.stub().returns(query)
    }
    apis = proxyquire('../../../src/apis', {
      'lodash': lodash,
      '../db': { Document }
    })
  })

  describe('listDocuments()', () => {
    beforeEach(() => {
      response = { documents }
    })

    it('should accept three arguments', () => {
      assert.equal(typeof apis.listDocuments, 'function')
      assert.equal(apis.listDocuments.length, 3)
    })

    it('should make appropriate mongoose APIs calls', () => {
      apis.listDocuments(req, res, next)

      assert(Document.find.calledWithExactly())
      assert.equal(typeof query.exec.firstCall.args[CALLBACK_POS], 'function')
    })

    it('should response with all documents available', () => {
      query.exec.yields(null, documents) // all documents
      apis.listDocuments(req, res, next)

      assert(res.json.calledWith(response))
    })

    it('should pass control to errorHandler when an error occurred', () => {
      query.exec.yields(err, null)
      apis.listDocuments(req, res, next)

      assert(next.calledWith(err))
    })
  })

  describe('getDocument()', () => {
    beforeEach(() => {
      response = { document: documents[0] }
    })

    it('should accept three arguments', () => {
      assert.equal(typeof apis.getDocument, 'function')
      assert.equal(apis.getDocument.length, 3)
    })

    it('should make appropriate mongoose APIs calls', () => {
      apis.getDocument(req, res, next)

      assert(Document.findOne.calledWithExactly({ _id: req.params._id })) // for verbosity
      assert.equal(typeof query.exec.firstCall.args[CALLBACK_POS], 'function')
    })

    it('should respose with specified document _id', () => {
      query.exec.yields(null, response.document) // first document
      apis.getDocument(req, res, next)

      assert(res.json.calledWith(response))
    })

    it('should pass control to errorHandler when an error occurred', () => {
      query.exec.yields(err, null)
      apis.getDocument(req, res, next)

      assert(next.calledWith(err))
    })

    it('should pass control to errorHandler with custom err when the document is not found', () => {
      query.exec.yields(null, null) // mongoose.findOne() returns null when no documents match criteria
      apis.getDocument(req, res, next)

      assert(next.calledWith({ status: 404, message: 'Not Found' }))
    })
  })

  describe('createDocument()', () => {
    const CREATE_CALLBACK_POS = 1

    beforeEach(() => {
      req.body = { _id: '4', f: 'x' }
      response = { document: req.body }
    })

    it('should accept three arguments', () => {
      assert.equal(typeof apis.createDocument, 'function')
      assert.equal(apis.createDocument.length, 3)
    })

    it('should make appropriate mongoose APIs calls', () => {
      apis.createDocument(req, res, next)

      assert(Document.create.calledWith(req.body))
      assert.equal(typeof Document.create.firstCall.args[CREATE_CALLBACK_POS], 'function')
    })

    it('should response with newly created document', () => {
      Document.create.yields(null, req.body)
      apis.createDocument(req, res, next)

      assert(res.json.calledWith(response))
    })

    it('should pass control to errorHandler when an error occurred', () => {
      Document.create.yields(err, null)
      apis.createDocument(req, res, next)

      assert(next.calledWith(err))
    })
  })

  describe('updateDocument()', () => {
    let updateDocument

    beforeEach(() => {
      req.body = { _id: '1', f: 'y' }
      response = { document: req.body }
      updateDocument = documents[0]
    })

    it('should accept three arguments', () => {
      assert.equal(typeof apis.updateDocument, 'function')
      assert.equal(apis.updateDocument.length, 3)
    })

    it('should make appropriate mongoose APIs calls', () => {
      apis.updateDocument(req, res, next)

      assert(Document.findOne.calledWithExactly({ _id: req.params._id })) // for verbosity
      assert.equal(typeof query.exec.firstCall.args[CALLBACK_POS], 'function')
    })

    it('should response with updated document', () => {
      query.exec.yields(null, updateDocument) // invoke findCallback
      updateDocument.save.yields(null, req.body) // invoke saveCallback
      apis.updateDocument(req, res, next)

      assert(lodash.merge.calledWith(updateDocument, req.body))
      assert(res.json.calledWith(response))
    })

    it('should pass control to errorHandler with custom err when the document to updated is not found', () => {
      query.exec.yields(null, null)
      apis.updateDocument(req, res, next)

      assert(next.calledWith({ status: 404, message: 'Not Found' }))
    })

    it('should pass control to errorHandler when an error occurred at findCallback()', () => {
      query.exec.yields(err, null)
      apis.updateDocument(req, res, next)

      assert(next.calledWith(err))
    })

    it('should pass control to errorHandler when an error occurred at saveCallback()', () => {
      query.exec.yields(null, updateDocument)
      updateDocument.save.yields(err, null)
      apis.updateDocument(req, res, next)

      assert(next.calledWith(err))
    })
  })

  describe('deleteDocument()', () => {
    let deleteDocument

    beforeEach(() => {
      deleteDocument = documents[0]
      response = {}
    })

    it('should accept three arguments', () => {
      assert.equal(typeof apis.deleteDocument, 'function')
      assert.equal(apis.deleteDocument.length, 3)
    })

    it('should make appropriate mongoose APIs calls', () => {
      query.exec.yields(null, deleteDocument)
      deleteDocument.remove.yields(null)
      apis.deleteDocument(req, res, next)

      assert(Document.findOne.calledWithExactly({ _id: req.params._id })) // for verbosity
      assert.equal(typeof query.exec.firstCall.args[CALLBACK_POS], 'function')
      assert.equal(typeof deleteDocument.remove.firstCall.args[CALLBACK_POS], 'function')
    })

    it('should response with no body', () => {
      query.exec.yields(null, deleteDocument)
      deleteDocument.remove.yields(null)
      apis.deleteDocument(req, res, next)

      assert(res.sendStatus.calledWith(204))
    })

    it('should pass control to errorHandler when there is no requested document', () => {
      query.exec.yields(null, null)
      apis.deleteDocument(req, res, next)

      assert(next.firstCall.calledWith({ status: 404, message: 'Not Found' }))
    })

    it('should pass control to errorHandler when an error occurred at findCallback()', () => {
      query.exec.yields(err)
      apis.deleteDocument(req, res, next)

      assert(next.firstCall.calledWith(err))
    })

    it('should pass control to errorHandler when an error occurred at deleteCallback()', () => {
      query.exec.yields(null, deleteDocument)
      deleteDocument.remove.yields(err)
      apis.deleteDocument(req, res, next)

      assert(next.firstCall.calledWith(err))
    })
  })
})