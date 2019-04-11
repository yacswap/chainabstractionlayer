/* global describe, it */

const { expect } = require('chai')

const dbg = require('debug')
const { Debug } = require('../../src')

describe('debug library', () => {
  it('should not add logs to the console.history if disabled', () => {
    const debug = Debug('test')
    debug('test')
    expect(console.history).to.equal(undefined)
  })

  it('should add logs to the console.history if enabled', () => {
    dbg.enable('liquality:cal*')

    const debug = Debug('test')
    debug('test')
    expect(console.history.length).to.equal(2)

    dbg.disable()
  })
})
