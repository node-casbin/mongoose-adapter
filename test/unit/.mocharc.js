module.exports = {
    recursive: true,
    extension: ['js'],
    diff: true,
    opts: false,
    exit: true,
    reporter: 'spec',
    slow: 75,
    ui: 'bdd',
    spec: 'test/unit/**/*.test.js'
};
