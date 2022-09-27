import { test, expect, Page, Locator } from '@playwright/test';
import { deleteVolume } from "./common";


const genN = (N: number) => {
    let tmp = Array(N).fill(0).map(() => Math.floor(Math.random() * 10));
    if (tmp[0] === 0) tmp[0] = 1;
    return tmp.join("");
};

async function createVolume(page: Page) {
    await page.locator('.btn').first().click();
    await expect(page.locator("h1.title")).toContainText("Создать новый том");
}

async function changeVolume(page: Page, year: number | string, num: number | string) {
    await page.locator('input[name="volume\\[year\\]"]').fill(year.toString());
    await page.locator('input[name="volume\\[year\\]"]').press('Tab');
    await page.locator('input[name="volume\\[number\\]"]').fill(num.toString());
    await page.locator('button:has-text("Сохранить изменения")').click();
}

const falsyValues = [
    { name: "256", val: genN(256) },
    { name: "Пробелы", val: "   " },
    { name: "Пусто", val: "" },
    { name: "Отрицательный", val: -genN(2) },
    { name: "0", val: 0 }
];

const validValues = {
    year: genN(4),
    num: genN(3),
    yearNew: genN(4),
    numNew: genN(3)
};

test.describe("Томы", () => {

    const volumeSelectors = {
        year: "#new-volume-form > div > div > fieldset > div > div:nth-child(1) > div",
        vol: "#new-volume-form > div > div > fieldset > div > div:nth-child(2) > div"
    };

    test.beforeEach(async ({ page }) => {
        await page.goto("?entity=Volume");
    });

    test.describe("Создание", () => {

        test.beforeEach(async ({ page }) => createVolume(page));

        test.describe("Некорректный год", () => {

            test.afterEach(async ({ page }) => {
                await page.locator('text=Вернуться к списку').click();
                page.once('dialog', dialog => dialog.dismiss());
            });

            for (const { name, val } of falsyValues) {
                test(`${name}`, async ({ page }) => {
                    await changeVolume(page, val, validValues.num);
                    await expect(page.locator(volumeSelectors.year)).toHaveClass(/has\-error/);
                    await expect(page.locator(volumeSelectors.vol)).not.toHaveClass(/has\-error/);
                });
            }

        });

        test.describe("Некорректный том", () => {

            test.afterEach(async ({ page }) => {
                await page.locator('text=Вернуться к списку').click();
                page.once('dialog', dialog => dialog.dismiss());
            });

            for (const { name, val } of falsyValues) {
                test(`${name}`, async ({ page }) => {
                    await changeVolume(page, validValues.year, val);
                    await expect(page.locator(volumeSelectors.year)).not.toHaveClass(/has\-error/);
                    await expect(page.locator(volumeSelectors.vol)).toHaveClass(/has\-error/);
                });
            }

        });

        test("Корректные данные", async ({ page }) => {
            await changeVolume(page, validValues.year, validValues.num);
            await expect(page.locator(`text=${validValues.year} ${validValues.num}`)).toBeVisible();
        });

        test("Существующий том", async ({ page }) => {
            await changeVolume(page, validValues.year, validValues.num);
            await expect(page.locator(volumeSelectors.year)).toHaveClass(/has\-error/);
            await expect(page.locator('text=Выпуск с таким порядковым номером и годом уже существует')).toBeVisible();
        });
    });

    test("Редактирование", async ({ page }) => {
        await page.locator(`text=${validValues.year} ${validValues.num} >> i`).first().click();
        await expect(page.locator('text=Изменение тома')).toBeVisible();
        await changeVolume(page, validValues.yearNew, validValues.numNew);
        await expect(page.locator(`text=${validValues.yearNew} ${validValues.numNew}`)).toBeVisible();
    });

    test("Удаление", async ({ page }) => {
        await deleteVolume(page, validValues.yearNew, validValues.numNew);
    });

});