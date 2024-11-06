
const test: any[] = [];
for (let i = 0; i < 10**6; i++) {
    test.push({ id: Math.trunc(Math.random() * 10**9).toString(), hidden: Math.random() > 0.5 })
}

const ctest: { id: string[], hidden: boolean[] } = { id: [], hidden: [] };
for (let i = 0; i < 10**6; i++) {
    ctest.id[i] = Math.trunc(Math.random() * 10**9).toString();
    ctest.hidden[i] = Math.random() > 0.5;
}

export const ITERATIONS_COUNT = 20;
export const JSON_TEMPLATE = test;
export const JSON_COLUMNS_TEMPLATE = ctest;
