import { test as base } from '@playwright/test';

export type TestOptions = {
    person: string;
};

export const test = base.extend<TestOptions>({
    // Define an option and provide a default value.
    // We can later override it in the config.
    person: ['John', { option: true }],
});