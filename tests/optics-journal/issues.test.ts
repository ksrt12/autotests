import { test, expect, Page, Locator } from '@playwright/test';
import { genN } from "../utils";
import { changeVolume, createVolume, deleteVolume, falsyValues } from "./common";

const validValues = {
    year: genN(4),
    vol: genN(3),
    issueNum: genN(3),
    issueNumNew: genN(3)
};


export async function changeIssue(page: Page, year: number | string, vol: number | string, issueNum: number | string, status = "Опубликован") {
    await page.locator('span[role="combobox"]').first().click();
    await page.locator(`li[role="option"]:has-text("Volume ${vol} ${year}")`).click();
    await page.locator('input[name="issue\\[number\\]"]').fill(issueNum.toString());
    await page.locator('span[role="combobox"]').nth(1).click();
    await page.locator(`li[role="option"]:has-text("${status}")`).click();
    await page.locator('button:has-text("Сохранить изменения")').click();
}

test.describe("Выпуски", () => {

    // Создание нового тома для теста выпусков
    test.beforeAll(async ({ page }) => {
        await page.goto("?entity=Volume");
        await createVolume(page);
        await changeVolume(page, validValues.year, validValues.vol);
    });

    // Удаление нового тома после теста выпусков
    test.afterAll(async ({ page }) => {
        await page.goto("?entity=Volume");
        await deleteVolume(page, validValues.year, validValues.vol);
    });

    // Переход на страниуц выпусков перед каждым тестом
    test.beforeEach(async ({ page }) => {
        await page.goto("?entity=Issue");
    });

    // Создани нового выпуска
    test.describe("Создание", () => {

        test.beforeEach(async ({ page }) => {
            await page.locator('.btn').first().click();
            await expect(page.locator("h1.title")).toContainText("Создать новый выпуск");
        });

        test.describe("Некорректный номер", () => {

            test.afterEach(async ({ page }) => {
                await page.locator('text=Вернуться к списку').click();
                page.once('dialog', dialog => dialog.dismiss());
            });

            for (const { name, val } of falsyValues) {
                test(`${name}`, async ({ page }) => {
                    await changeIssue(page, validValues.year, validValues.vol, val);
                    await expect(page.locator("#new-issue-form > div > div > fieldset > div > div:nth-child(2) > div"))
                        .toHaveClass(/has\-error/);
                });
            }

        });

        test("Корректный номер", async ({ page }) => {
            await changeIssue(page, validValues.year, validValues.vol, validValues.issueNum);
            await expect(page.locator(`text=Volume ${validValues.vol} ${validValues.year} ${validValues.issueNum}`)).toBeVisible();
        });

    });

    test.describe("Редактирование", () => {

        // test.beforeEach(async ({ page }) => {
        //     await page.locator(`text=Volume ${validValues.vol} ${validValues.year} ${validValues.issueNum} Опубликован >> i`).nth(1).click();
        //     await expect(page.locator('text=Изменение выпуска')).toBeVisible();
        // });

        test("Номер", async ({ page }) => {
            await page.locator(`text=Volume ${validValues.vol} ${validValues.year} ${validValues.issueNum} Опубликован >> i`).nth(0).click();
            await expect(page.locator('text=Изменение выпуска')).toBeVisible();
            await changeIssue(page, validValues.year, validValues.vol, validValues.issueNumNew);
            await expect(page.locator(`text=Volume ${validValues.vol} ${validValues.year} ${validValues.issueNumNew} Опубликован`)).toBeVisible();
        });

        test("Статус", async ({ page }) => {
            await page.locator(`text=Volume ${validValues.vol} ${validValues.year} ${validValues.issueNumNew} Опубликован >> i`).nth(0).click();
            await expect(page.locator('text=Изменение выпуска')).toBeVisible();
            await changeIssue(page, validValues.year, validValues.vol, validValues.issueNumNew, "В подготовке");
            await expect(page.locator(`text=Volume ${validValues.vol} ${validValues.year} ${validValues.issueNumNew} В подготовке`)).toBeVisible();
        });

    });

    test("Удаление", async ({ page }) => {
        await page.locator(`text=Volume ${validValues.vol} ${validValues.year} ${validValues.issueNumNew} В подготовке >> i`).nth(2).click();
        await page.locator('#modal-delete-button').click();
        await expect(page.locator(`text=Volume ${validValues.vol} ${validValues.year} ${validValues.issueNumNew} В подготовке`)).not.toBeVisible();
    });

});