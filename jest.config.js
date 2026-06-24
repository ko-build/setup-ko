module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', {targets: {node: 'current'}}],
          '@babel/preset-typescript'
        ]
      }
    ]
  },
  verbose: true
};
