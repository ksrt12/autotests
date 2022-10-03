import { test, expect, Page } from '@playwright/test';
import { bigFalsyStrings, falsyStrings, falsyValues, gen } from "../utils";

const confirmDelete = (page: Page) => page.locator('#modal-delete-button').click();

const save = (page: Page) => page.locator('button:has-text("Сохранить изменения")').click();

async function search(page: Page, vals: (string | number)[]) {
    await page.locator('[placeholder="Поиск"]').fill(vals.join(" "));
    await page.locator('[placeholder="Поиск"]').press('Enter');
    for (const val of vals) {
        await expect(page.locator(`text=${val}`)).toHaveClass(/highlight/);
    };
}

async function createVolume(page: Page) {
    await page.locator('.btn').first().click();
    await expect(page.locator("h1.title")).toContainText("Создать новый том");
}

async function changeVolume(page: Page, year: number | string, num: number | string) {
    await page.locator('input[name="volume\\[year\\]"]').fill(year.toString());
    await page.locator('input[name="volume\\[year\\]"]').press('Tab');
    await page.locator('input[name="volume\\[number\\]"]').fill(num.toString());
    await save(page);
}

async function deleteVolume(page: Page, year: number | string, num: number | string) {
    await page.locator(`text=${year} ${num} >> i`).nth(2).click();
    await confirmDelete(page);
    await expect(page.locator(`text=${year} ${num}`)).not.toBeVisible();
}

type issueStatus = "Опубликован" | "В подготовке";

interface IVolume {
    year: string;
    num: string;
}

test.describe("Томы", () => {
    test.describe.configure({ mode: "serial" });

    const vol: IVolume = {
        year: gen.N(4),
        num: gen.N(3),
    };

    const volNew: IVolume = {
        year: gen.N(4),
        num: gen.N(3),
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
                    await changeVolume(page, val, vol.num);
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
                    await changeVolume(page, vol.year, val);
                    await expect(page.locator(volumeSelectors.year)).not.toHaveClass(/has\-error/);
                    await expect(page.locator(volumeSelectors.vol)).toHaveClass(/has\-error/);
                });
            }

        });

        test("Корректные данные", async ({ page }) => {
            await changeVolume(page, vol.year, vol.num);
            await expect(page.locator(`text=${vol.year} ${vol.num}`)).toBeVisible();
        });

        test("Существующий том", async ({ page }) => {
            await changeVolume(page, vol.year, vol.num);
            await expect(page.locator(volumeSelectors.year)).toHaveClass(/has\-error/);
            await expect(page.locator('text=Выпуск с таким порядковым номером и годом уже существует')).toBeVisible();
        });
    });

    test("Редактирование", async ({ page }) => {
        await page.locator(`text=${vol.year} ${vol.num} >> i`).first().click();
        await expect(page.locator('text=Изменение тома')).toBeVisible();
        await changeVolume(page, volNew.year, volNew.num);
        await expect(page.locator(`text=${volNew.year} ${volNew.num}`)).toBeVisible();
    });

    test("Поиск", async ({ page }) => {
        await search(page, [volNew.year, volNew.num]);
        // await search(page, [2022, 89]);
    });

    test("Удаление", async ({ page }) => {
        await deleteVolume(page, volNew.year, volNew.num);
    });

});

async function createIssue(page: Page) {
    await page.locator('.btn').first().click();
    await expect(page.locator("h1.title")).toContainText("Создать новый выпуск");
}

async function changeIssue(page: Page, year: number | string, vol: number | string, issueNum: number | string, status: issueStatus = "Опубликован") {
    await page.locator('span[role="combobox"]').first().click();
    await page.locator(`li[role="option"]:has-text("Volume ${vol} ${year}")`).click();
    await page.locator('input[name="issue\\[number\\]"]').fill(issueNum.toString());
    await page.locator('span[role="combobox"]').nth(1).click();
    await page.locator(`li[role="option"]:has-text("${status}")`).click();
    await save(page);
}

async function deleteIssue(page: Page, issue: IIssue, status: issueStatus = "В подготовке") {
    await page.locator(`text=Volume ${issue.vol} ${issue.year} ${issue.numNew} ${status} >> i`).nth(2).click();
    await confirmDelete(page);
    await expect(page.locator(`text=Volume ${issue.vol} ${issue.year} ${issue.numNew} ${status}`)).not.toBeVisible();
}

interface IIssue {
    year: string;
    vol: string;
    num: string;
    numNew: string;
}

test.describe("Выпуски", () => {
    test.describe.configure({ mode: "serial" });

    const issue: IIssue = {
        year: gen.N(4),
        vol: gen.N(3),
        num: gen.N(3),
        numNew: gen.N(3)
    };

    // Создание нового тома для теста выпусков
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto("?entity=Volume");
        await createVolume(page);
        await changeVolume(page, issue.year, issue.vol);
        await context.close();
    });

    // Удаление нового тома после теста выпусков
    test.afterAll(async ({ page }) => {
        await page.goto("?entity=Volume");
        await deleteVolume(page, issue.year, issue.vol);
    });

    // Переход на страницу выпусков перед каждым тестом
    test.beforeEach(async ({ page }) => {
        await page.goto("?entity=Issue");
    });

    // Создани нового выпуска
    test.describe("Создание", () => {

        // Кнопка добавить выпуск
        test.beforeEach(async ({ page }) => await createIssue(page));

        test.describe("Некорректный номер", () => {

            test.afterEach(async ({ page }) => {
                await page.locator('text=Вернуться к списку').click();
                page.once('dialog', dialog => dialog.dismiss());
            });

            for (const { name, val } of falsyValues) {
                test(`${name}`, async ({ page }) => {
                    await changeIssue(page, issue.year, issue.vol, val);
                    await expect(page.locator("#new-issue-form > div > div > fieldset > div > div:nth-child(2) > div"))
                        .toHaveClass(/has\-error/);
                });
            }

        });

        test("Корректный номер", async ({ page }) => {
            await changeIssue(page, issue.year, issue.vol, issue.num);
            await expect(page.locator(`text=Volume ${issue.vol} ${issue.year} ${issue.num}`)).toBeVisible();
        });

    });

    test.describe("Редактирование", () => {

        // test.beforeEach(async ({ page }) => {
        //     await page.locator(`text=Volume ${validValues.vol} ${validValues.year} ${validValues.issueNum} Опубликован >> i`).nth(1).click();
        //     await expect(page.locator('text=Изменение выпуска')).toBeVisible();
        // });

        test("Номер", async ({ page }) => {
            await page.locator(`text=Volume ${issue.vol} ${issue.year} ${issue.num} Опубликован >> i`).nth(0).click();
            await expect(page.locator('text=Изменение выпуска')).toBeVisible();
            await changeIssue(page, issue.year, issue.vol, issue.numNew);
            await expect(page.locator(`text=Volume ${issue.vol} ${issue.year} ${issue.numNew} Опубликован`)).toBeVisible();
        });

        test("Статус", async ({ page }) => {
            await page.locator(`text=Volume ${issue.vol} ${issue.year} ${issue.numNew} Опубликован >> i`).nth(0).click();
            await expect(page.locator('text=Изменение выпуска')).toBeVisible();
            await changeIssue(page, issue.year, issue.vol, issue.numNew, "В подготовке");
            await expect(page.locator(`text=Volume ${issue.vol} ${issue.year} ${issue.numNew} В подготовке`)).toBeVisible();
        });

    });

    test("Поиск", async ({ page }) => {
        await search(page, [issue.vol, issue.year, issue.numNew]);
    });

    test("Удаление", async ({ page }) => {
        await deleteIssue(page, issue);
    });

});

async function setAuthorFields(page: Page, key: string, val: string) {
    await page.locator(`textarea[name="author\\[${key}\\]"]`).fill(val);
}

async function createAuthor(page: Page) {
    await page.locator('.btn').first().click();
    await expect(page.locator("h1.title")).toContainText("Создание автора");
}

async function changeAuthor(page: Page, author: IAuthor) {
    await page.locator(`text=${author.firstnameRu} ${author.lastnameRu} ${author.degreeRu} ${author.jobPlaceRu} >> i`).first().click();
    await expect(page.locator("h1.title")).toContainText("Изменение автора");
}

async function deleteAuthor(page: Page, author: IAuthor) {
    await page.locator(`text=${author.firstnameRu} ${author.lastnameRu} ${author.degreeRu} ${author.jobPlaceRu} >> i`).nth(2).click();
    await confirmDelete(page);
    await expect(page.locator(`text=${author.firstnameRu} ${author.lastnameRu} ${author.degreeRu} ${author.jobPlaceRu}`)).not.toBeVisible();
}

interface IAuthor {
    firstnameRu: string;
    firstnameEn: string;
    lastnameRu: string;
    lastnameEn: string;
    degreeRu: string;
    degreeEn: string;
    jobPlaceRu: string;
    jobPlaceEn: string;
}

test.describe("Авторы", () => {
    test.describe.configure({ mode: "serial" });

    const author: IAuthor = {
        firstnameRu: gen.RU(5),
        firstnameEn: gen.EN(5),
        lastnameRu: gen.RU(5),
        lastnameEn: gen.EN(5),
        degreeRu: gen.RU(5),
        degreeEn: gen.EN(5),
        jobPlaceRu: gen.RU(5),
        jobPlaceEn: gen.EN(5),
    };

    const authorNew: IAuthor = {
        firstnameRu: gen.RU(5),
        firstnameEn: gen.EN(5),
        lastnameRu: gen.RU(5),
        lastnameEn: gen.EN(5),
        degreeRu: gen.RU(5),
        degreeEn: gen.EN(5),
        jobPlaceRu: gen.RU(5),
        jobPlaceEn: gen.EN(5),
    };

    // Переход на страницу автором перед каждым тестом
    test.beforeEach(async ({ page }) => {
        await page.goto("?entity=Author");
    });

    test.describe("Создание", () => {


        // Кнопка добавить автора
        test.beforeEach(async ({ page }) => {
            await createAuthor(page);
            for (const [key, val] of Object.entries(author)) {
                await setAuthorFields(page, key, val);
            }
        });

        test.describe("Некорректные данные", () => {

            for (const key of Object.keys(author)) {
                for (const badVal of [...falsyStrings, ...bigFalsyStrings]) {
                    test(`${key}:${badVal.name}`, async ({ page }) => {
                        await setAuthorFields(page, key, badVal.val);
                        await save(page);
                        await expect(page.locator(`textarea[name="author\\[${key}\\]"]`)).toHaveClass(/is\-invalid/);
                    });
                }
            }

        });

        test("Корректные данные", async ({ page }) => {
            await save(page);
            await expect(page.locator(`text=${author.firstnameRu} ${author.lastnameRu} ${author.degreeRu} ${author.jobPlaceRu}`)).toBeVisible();
        });

    });

    test("Редактирование", async ({ page }) => {
        await changeAuthor(page, author);
        for (const [key, val] of Object.entries(authorNew)) {
            await setAuthorFields(page, key, val);
        }
        await save(page);
        await expect(page.locator(`text=${authorNew.firstnameRu} ${authorNew.lastnameRu} ${authorNew.degreeRu} ${authorNew.jobPlaceRu}`)).toBeVisible();
    });

    test.fixme("Поиск", async ({ page }) => {
        await search(page, [authorNew.firstnameRu, authorNew.lastnameRu, authorNew.degreeRu, authorNew.jobPlaceRu]);
        await page.goBack();
    });

    test("Удаление", async ({ page }) => {
        await deleteAuthor(page, authorNew);
    });

});

interface IArticle {
    title: string;
    pages: string;
    eLibraryRu: string;
    eLibraryEn: string;
    annotationRu: string;
    annotationEn: string;
    issue: string;
    authors: string;
}

async function createArticle(page: Page) {
    await page.locator('.btn').first().click();
    await expect(page.locator("h1.title")).toContainText("Создать новую статью");
}

async function changeArticle(page: Page, article: IArticle) {
    await page.locator(`text=${article.annotationRu} ${article.pages} ${article.issue} >> i`).first().click();
    await expect(page.locator("h1.title")).toContainText("Изменение статьи");
}

async function deleteArticle(page: Page, article: IArticle) {
    await page.locator(`text=${article.annotationRu} ${article.pages} ${article.issue} >> i`).nth(2).click();
    await confirmDelete(page);
    await expect(page.locator(`text=${article.annotationRu} ${article.pages} ${article.issue}`)).not.toBeVisible();
}

test.describe.skip("Статьи", () => {
    test.describe.configure({ mode: "serial" });

    const issueNum = gen.N(2);

    const issue: IIssue = {
        year: gen.N(4),
        vol: gen.N(3),
        num: issueNum,
        numNew: issueNum
    };

    const author: IAuthor = {
        firstnameRu: gen.RU(5),
        firstnameEn: gen.EN(5),
        lastnameRu: gen.RU(5),
        lastnameEn: gen.EN(5),
        degreeRu: gen.RU(5),
        degreeEn: gen.EN(5),
        jobPlaceRu: gen.RU(5),
        jobPlaceEn: gen.EN(5),
    };

    const article: IArticle = {
        title: gen.RU(8),
        pages: gen.N(2),
        eLibraryRu: "https://" + gen.EN(5) + ".ru",
        eLibraryEn: "https://" + gen.EN(5) + ".com",
        annotationRu: gen.RU(255),
        annotationEn: gen.EN(255),
        issue: `Issue ${issue.num}, volume ${issue.vol}`,
        authors: `${author.firstnameRu} ${author.lastnameRu}`
    };

    const badArticle: IArticle = {
        ...article,
        title: gen.RU(256),
        annotationRu: gen.RU(2001)
    };

    // test.beforeAll(async ({ browser }) => {
    //     const context = await browser.newContext();
    //     const page = await context.newPage();
    //     await page.goto("?entity=Volume");
    //     await createVolume(page);
    //     await changeVolume(page, issue.year, issue.vol);
    //     await page.goto("?entity=Issue");
    //     await createIssue(page);
    //     await changeIssue(page, issue.year, issue.vol, issue.num, "Опубликован");
    //     await page.goto("?entity=Author");
    //     await createAuthor(page);
    //     for (const [key, val] of Object.entries(author)) {
    //         await setAuthorFields(page, key, val);
    //     }
    //     await save(page);
    //     await context.close();
    // });

    // test.afterAll(async ({ browser }) => {
    //     const context = await browser.newContext();
    //     const page = await context.newPage();
    //     await page.goto("?entity=Volume");
    //     await deleteVolume(page, issue.year, issue.vol);
    //     await page.goto("?entity=Issue");
    //     await deleteIssue(page, issue, "В подготовке");
    //     await page.goto("?entity=Author");
    //     await deleteAuthor(page, author);
    //     await page.goto("?entity=Article");
    //     await deleteArticle(page, article);
    //     context.close();
    // });

    test.beforeEach(async ({ page }) => {
        await page.goto("?entity=Article");
    });

    test.describe("Создание", () => {


        // Кнопка добавить статью
        test.beforeEach(async ({ page }) => {
            await createArticle(page);

            for (const key of Object.keys(article)) {

                switch (key) {
                    case "title":
                    case "pages":
                    case "eLibraryRu":
                    case "eLibraryEn":
                        await page.locator(`input[name="article\\[${key}\\]"]`).fill(article[key]);
                        break;
                    case "annotationRu":
                    case "annotationEn":
                        const p = page.frameLocator(`text=Визуальный текстовый редактор, article_${key}Панели инструментов редактора >> iframe`)
                            .locator('p');
                        await p.click();
                        await p.fill(article[key]);
                        break;
                    case "issue":
                        await page.locator('span[role="combobox"]:has-text("Пусто")').click();
                        await page.locator('input[role="searchbox"]').nth(1).fill(article.issue);
                        await page.locator(`li[role="option"]:has-text("${article.issue}")`).click();
                        break;
                    case "authors":
                        await page.locator('input[role="searchbox"]').first().click();
                        await page.locator(`li[role="option"]:has-text("${article.authors}")`).click();
                        break;
                }

            }

        });

        test.skip("Некорректные данные", () => {

            test("Имя", async ({ page }) => {

            });

            for (const key of Object.keys(author)) {
                for (const badVal of [...falsyStrings, ...bigFalsyStrings]) {
                    test(`${key}:${badVal.name}`, async ({ page }) => {
                        await setAuthorFields(page, key, badVal.val);
                        await save(page);
                        await expect(page.locator(`textarea[name="author\\[${key}\\]"]`)).toHaveClass(/is\-invalid/);
                    });
                }
            }

        });

        test("Корректные данные", async ({ page }) => {
            await save(page);
            await expect(page.locator(`text=${article.title} ${article.pages} ${article.issue}`)).toBeVisible();
        });

    });




});