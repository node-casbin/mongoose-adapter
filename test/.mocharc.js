module.exports = {
    recursive: true,
    extension: ['js'],
    diff: true,
    opts: false,
    exit: true,
    reporter: 'spec',
    slow: 75,
    timeout: 4000,
    ui: 'bdd',
    spec: 'test/**/**/*.test.js'
};