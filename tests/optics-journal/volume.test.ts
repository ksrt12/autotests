import { test, expect, Page, Locator } from '@playwright/test';
import { falsyStrings, falsyValues, genN, genStringEn, genStringRu } from "../utils";

const confirmDelete = (page: Page) => page.locator('#modal-delete-button').click();

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

async function deleteVolume(page: Page, year: number | string, num: number | string) {
    await page.locator(`text=${year} ${num} >> i`).nth(2).click();
    await confirmDelete(page);
    await expect(page.locator(`text=${year} ${num}`)).not.toBeVisible();
}

test.describe("Томы", () => {

    const validValues = {
        year: genN(4),
        num: genN(3),
        yearNew: genN(4),
        numNew: genN(3)
    };

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

export async function changeIssue(page: Page, year: number | string, vol: number | string, issueNum: number | string, status = "Опубликован") {
    await page.locator('span[role="combobox"]').first().click();
    await page.locator(`li[role="option"]:has-text("Volume ${vol} ${year}")`).click();
    await page.locator('input[name="issue\\[number\\]"]').fill(issueNum.toString());
    await page.locator('span[role="combobox"]').nth(1).click();
    await page.locator(`li[role="option"]:has-text("${status}")`).click();
    await page.locator('button:has-text("Сохранить изменения")').click();
}

test.describe("Выпуски", () => {

    const validValues = {
        year: genN(4),
        vol: genN(3),
        issueNum: genN(3),
        issueNumNew: genN(3)
    };

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

    // Переход на страницу выпусков перед каждым тестом
    test.beforeEach(async ({ page }) => {
        await page.goto("?entity=Issue");
    });

    // Создани нового выпуска
    test.describe("Создание", () => {

        // Кнопка добавить выпуск
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

async function setText(page: Page, key: string, val: string) {
    console.log(key, val);

    page.locator(`textarea[name="author\\[${key}\\]"]`).fill(val);
}


test.skip("Авторы", () => {

    const person = {
        firstnameRu: genStringRu(5),
        firstnameEn: genStringEn(5),
        lastnameRu: genStringRu(5),
        lastnameEn: genStringEn(5),
        degreeRu: genStringRu(5),
        degreeEn: genStringEn(5),
        jobPlaceRu: genStringRu(5),
        jobPlaceEn: genStringEn(5),
    };

    const personNew = {
        firstnameRu: genStringRu(5),
        firstnameEn: genStringEn(5),
        lastnameRu: genStringRu(5),
        lastnameEn: genStringEn(5),
        degreeRu: genStringRu(5),
        degreeEn: genStringEn(5),
        jobPlaceRu: genStringRu(5),
        jobPlaceEn: genStringEn(5),
    };

    // Переход на страницу автором перед каждым тестом
    test.beforeEach(async ({ page }) => {
        await page.goto("?entity=Author");
    });

    test.describe("Создание", () => {

        // Кнопка добавить автора
        test.beforeEach(async ({ page }) => {
            await page.locator('.btn').first().click();
            await expect(page.locator("h1.title")).toContainText("Создание автора");
            for (const [key, val] of Object.entries(person)) {
                await setText(page, key, val);
            }
        });

        test.describe("Некорректные данные", () => {

            for (const key of Object.keys(person)) {
                for (const badVal of falsyStrings) {
                    test(`${key}:${badVal.name}`, async ({ page }) => {
                        setText(page, key, badVal.val);
                        await page.locator('button:has-text("Сохранить изменения")').click();
                        await expect(page.locator(`textarea[name="author\\[${key}\\]"] > textarea`)).toHaveClass(/is\-invalid/);
                    });
                }
            }

        });



    });

});