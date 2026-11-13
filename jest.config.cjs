module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|mjs)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@mswjs|until-async|rettime|headers-polyfill|strict-event-emitter|outvariant)/)',
  ],
};
