/** @type {import('jest').Config} */
module.exports = {
  preset: "react-native",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-native-community)/)",
  ],
  setupFiles: [],
  moduleNameMapper: {
    "^react-native/jest/setup$": "<rootDir>/test/reactNativeSetupMock.js",
    "^react-native/jest/mock$": "<rootDir>/test/reactNativeJestMock.js",
  },
}
