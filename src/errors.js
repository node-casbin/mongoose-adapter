class AdapterError extends Error {
  constructor (message) {
    super(message)
    this.name = 'AdapterError'
  }
}

class InvalidConnectionError extends Error {
  constructor (message) {
    super(message)
    this.name = 'InvalidConnectionError'
  }
}

module.exports = { AdapterError, InvalidConnectionError }
