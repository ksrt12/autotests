export function genN(N: number) {
    let tmp = Array(N).fill(0).map(() => Math.floor(Math.random() * 10));
    if (tmp[0] === 0) {
        tmp[0] = 1;
    }
    return tmp.join("");
}