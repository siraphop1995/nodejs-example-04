'use strict'

const assert = require('chai').assert
const proxyquire = require('proxyquire')
const sinon = require('sinon')

describe('Documents functions', () => {
  let process, functions, hooks, methods, toJSON, nextSpy, doc

  beforeEach(() => {
    doc = {
      name: 'test',
      metadata: {
        created: 'created',
        updated: 'updated'
      }
    }
    nextSpy = sinon.spy()
    process = {
      stdout: {
        write: sinon.spy()
      }
    }
    
    functions = proxyquire('../../../../src/db/models/document/functions', {
      'process': process
    })
    hooks = functions.hooks
    methods = functions.methods
    toJSON = functions.toJSON
  })

  describe('Hooks', () => {
    describe('pre', () => {
      describe('save()', () => {
        beforeEach(() => hooks.pre.save(nextSpy))

        it('should call `process.stdout.write()`', () => {
          assert(process.stdout.write.calledWith('New document is being added...'))
        })

        it('should call next()', () => {
          assert(nextSpy.called)
        })
      })
    })

    describe('post', () => {
      describe('save()', () =>{
        beforeEach(() => hooks.post.save(doc))

        it('should call `process.stdout.write()`', () => {
          assert(process.stdout.write.calledWith(`Document '${doc.name}' was added`))
        })
      })
    })
  })

  describe('Methods', () => {
    describe('getMetadata()', () => {
      it('should return a predefined string', () => {
        let metadata = `${doc.name}: createdAt ${doc.metadata.created}, updatedAt ${doc.metadata.updated}`

        // use .call() to specify `this` context to the function
        assert.equal(methods.getMetadata.call(doc), metadata)
      })
    })
  })

  describe('toJSON', () => {
    describe('transform()', () => {
      it('should remove __v property', () => {
        let obj = {
          __v: '0',
          key: 'value'
        }

        assert.deepEqual(toJSON.transform({}, obj), { key: 'value' })
      })
    })
  })
})