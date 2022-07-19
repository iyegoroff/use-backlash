// eslint-disable-next-line no-undef
module.exports = {
  coverageDirectory: 'coverage',
  collectCoverage: true,
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'ts', 'tsx', 'jsx'],
  coveragePathIgnorePatterns: ['/node_modules/', 'test/'],
  testRegex: '\\.spec\\.tsx$'
}
