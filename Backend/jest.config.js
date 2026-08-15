module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 15000,
  verbose: true,
};