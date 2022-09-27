export function genN(n: number) {
    let tmp = Array(n).fill(0).map(() => Math.floor(Math.random() * 10));
    if (tmp[0] === 0) {
        tmp[0] = 1;
    }
    return tmp.join("");
}

export function genStringEn(n: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < n; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

export function genStringRu(n: number) {
    let result = '';
    const characters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя';
    const charactersLength = characters.length;
    for (let i = 0; i < n; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

export const falsyStrings = [
    { name: "Пробелы", val: "   " },
    { name: "Пусто", val: "" },
];

export const falsyValues = [
    { name: "256", val: genN(256) },
    { name: "Отрицательный", val: -genN(2) },
    { name: "0", val: 0 },
    ...falsyStrings
];