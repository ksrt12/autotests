import { test, expect, Page, Locator } from '@playwright/test';


const genN = (N: number) => {
    let tmp = Array(N).fill(0).map(() => Math.floor(Math.random() * 10));
    if (tmp[0] === 0) tmp[0] = 1;
    return tmp.join("");
};


const arr255 = Array(255).fill(1).join("");
const arr256 = arr255 + "1";

const haveErrClass = (page: Page, selector: string) => expect(page.locator(selector)).toHaveClass(/has\-error/);

test.describe("Томы", () => {

    // test.use({

    // });

    const falsyValues = [
        { name: "256", val: genN(256) },
        { name: "Пробелы", val: "   " },
        { name: "Пусто", val: "" },
        { name: "Отрицательный", val: -genN(2) },
        { name: "0", val: 0 }
    ];

    const validValues = {
        year: { name: "Корректный год", val: genN(4) },
        num: { name: "Корректный номер", val: genN(3) },
        yearNew: genN(4),
        numNew: genN(3)
    };

    const testMakeVolume = {
        year: genN(4),
        num: genN(2),
        changedYear: genN(4),
        changedNum: genN(2)
    };

    console.log(testMakeVolume);


    test.beforeEach(async ({ page }) => await page.goto("?entity=Volume"));

    async function changeVolume(page: Page, year: number | string, num: number | string) {
        await page.locator('input[name="volume\\[year\\]"]').fill(year.toString());
        await page.locator('input[name="volume\\[year\\]"]').press('Tab');
        await page.locator('input[name="volume\\[number\\]"]').fill(num.toString());
        await page.locator('button:has-text("Сохранить изменения")').click();
    }

    test.describe("Создание", () => {

        test.beforeEach(async ({ page }) => {
            await page.goto("?entity=Volume");
            await page.locator('.btn').first().click();
            await expect(page.locator("h1.title")).toContainText("Создать новый том");
        });

        for (const { name: yearName, val: yearVal } of falsyValues) {
            for (const { name: volName, val: volVal } of falsyValues)

                test(`Год: ${yearName}, Том: ${volName}`, async ({ page }) => {
                    await changeVolume(page, yearVal, volVal);
                    await haveErrClass(page, "#new-volume-form > div > div > fieldset > div > div:nth-child(1) > div");
                    await haveErrClass(page, "#new-volume-form > div > div > fieldset > div > div:nth-child(2) > div");
                });
        }

        test("Корректные данные", async ({ page }) => {
            await changeVolume(page, testMakeVolume.year, testMakeVolume.num);
            await expect(page.locator(`text=${testMakeVolume.year} ${testMakeVolume.num}`)).toBeVisible();
        });

    });

    test("Редактирование", async ({ page }) => {

        await page.locator(`text=${testMakeVolume.year} ${testMakeVolume.num} >> i`).first().click();
        await expect(page.locator('text=Изменение тома')).toBeVisible();
        await changeVolume(page, testMakeVolume.changedYear, testMakeVolume.changedNum);
        await expect(page.locator(`text=${testMakeVolume.changedYear} ${testMakeVolume.changedNum}`)).toBeVisible();

    });

    test("Удаление", async ({ page }) => {

        await page.locator(`text=${testMakeVolume.changedYear} ${testMakeVolume.changedNum} >> i`).nth(2).click();
        await page.locator('#modal-delete-button').click();
        await expect(page.locator(`text=${testMakeVolume.changedYear} ${testMakeVolume.changedNum}`)).not.toBeVisible();

    });
});