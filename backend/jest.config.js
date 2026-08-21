module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  setupFiles: ["<rootDir>/jest.setup.env.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 15000,
  verbose: true,
};