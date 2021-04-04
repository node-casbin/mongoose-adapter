class AdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdapterError';
  }
}

class InvalidAdapterTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAdapterTypeError';
  }
}

export {AdapterError, InvalidAdapterTypeError}
