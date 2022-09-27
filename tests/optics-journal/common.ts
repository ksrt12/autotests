import { expect, Page } from "@playwright/test";
import { genN } from "../utils";

export async function createVolume(page: Page) {
    await page.locator('.btn').first().click();
    await expect(page.locator("h1.title")).toContainText("Создать новый том");
}

export async function changeVolume(page: Page, year: number | string, num: number | string) {
    await page.locator('input[name="volume\\[year\\]"]').fill(year.toString());
    await page.locator('input[name="volume\\[year\\]"]').press('Tab');
    await page.locator('input[name="volume\\[number\\]"]').fill(num.toString());
    await page.locator('button:has-text("Сохранить изменения")').click();
}

export async function deleteVolume(page: Page, year: number | string, num: number | string) {
    await page.locator(`text=${year} ${num} >> i`).nth(2).click();
    await page.locator('#modal-delete-button').click();
    await expect(page.locator(`text=${year} ${num}`)).not.toBeVisible();
}

export const falsyValues = [
    { name: "256", val: genN(256) },
    { name: "Пробелы", val: "   " },
    { name: "Пусто", val: "" },
    { name: "Отрицательный", val: -genN(2) },
    { name: "0", val: 0 }
];