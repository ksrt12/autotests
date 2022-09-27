import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto("https://optic-journal-test.itmo.dev/admin/login");
    await page.locator('input[name="_username"]').fill('admin');
    await page.locator('input[name="_password"]').fill('admin');
    await page.locator('text=Войти').click();
    await page.context().storageState({ path: 'storageState.json' });
    await browser.close();
}

export default globalSetup;