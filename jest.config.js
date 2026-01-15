module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',

  // 模块路径别名
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/tests/__mocks__/styleMock.js',
  },

  // 测试文件匹配模式
  testMatch: ['<rootDir>/tests/**/*.test.js'],

  // 覆盖率收集
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/**/*.scss',
  ],

  // 覆盖率目录
  coverageDirectory: 'coverage',

  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html'],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 转换配置
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // 忽略转换的模块
  transformIgnorePatterns: [
    '/node_modules/',
  ],

  // 详细输出
  verbose: true,
}
