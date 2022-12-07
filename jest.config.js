const config = {
  coverageDirectory: 'coverage',
  collectCoverage: true,
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!@testing-library/preact|preact)'],
  transform: {
    '^.+\\.([jt]sx?|mjs)$': 'babel-jest'
  },
  coveragePathIgnorePatterns: ['/node_modules/', 'test/'],
  testRegex: '\\.spec\\.tsx?$'
}

export default config
