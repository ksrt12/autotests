function genAny(dictionary: string, n: number) {
    let result = '';
    const len = dictionary.length;
    for (let i = 0; i < n; i++) {
        result += dictionary.charAt(Math.floor(Math.random() * len));
    }
    return result;
};

export const gen = {
    N: (n: number) => genAny('123456789', n),
    RU: (n: number) => genAny('АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя', n),
    EN: (n: number) => genAny('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', n)
};

export const falsyStrings = [
    { name: "Пробелы", val: "   " },
    { name: "Пусто", val: "" },
];

export const bigFalsyStrings = [
    { name: "RU256", val: gen.RU(256) },
    { name: "EN256", val: gen.EN(256) },
];

export const falsyValues = [
    { name: "256", val: gen.N(256) },
    { name: "Отрицательный", val: -gen.N(2) },
    { name: "0", val: 0 },
    ...falsyStrings
];