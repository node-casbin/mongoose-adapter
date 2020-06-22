class AdapterError extends Error {
  constructor (message) {
    super(message)
    this.name = 'AdapterError'
  }
}

class InvalidAdapterTypeError extends Error {
  constructor (message) {
    super(message)
    this.name = 'InvalidAdapterTypeError'
  }
}

module.exports = { AdapterError, InvalidAdapterTypeError }
