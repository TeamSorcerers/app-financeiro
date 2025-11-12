const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: [ "<rootDir>/src", "<rootDir>/tests" ],
  testMatch: [
    "**/__tests__/**/*.ts",
    "**/?(*.)+(spec|test).ts",
  ],
  transform: { "^.+\\.ts$": "ts-jest" },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testTimeout: 30000,
  extensionsToTreatAsEsm: [ ".ts" ],
  moduleFileExtensions: [ "ts", "js", "json" ],
};

export default config;
