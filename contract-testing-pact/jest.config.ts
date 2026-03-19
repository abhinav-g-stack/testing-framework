import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testTimeout: 30000,
    roots: ['<rootDir>/consumer', '<rootDir>/provider'],
};

export default config;
