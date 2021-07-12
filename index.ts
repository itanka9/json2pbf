import { unpackJson } from './src/json2pbf';
import { ITERATIONS_COUNT, JSON_TEMPLATE } from './src/config';

const worker = new Worker(new URL('./src/worker.ts', import.meta.url));
const decoder = new TextDecoder('utf-8');
async function makeTests() {
    function waitResults(type: number, unpack: (data: any) => { data: any; hash: string }) {
        const results: any[] = [];
        const converted: any[] = [];
        return new Promise<void>((res) => {
            let count = 0;

            worker.onmessage = (evt) => {
                if (count === 0) {
                    console.time('receive');
                }
                count++;
                results.push(evt.data.data);
                if (count === ITERATIONS_COUNT) {
                    console.timeEnd('receive');
                    console.time('unpack');
                    for (let i = 0; i < ITERATIONS_COUNT; i++) {
                        converted.push(unpack(results[i]));
                    }
                    console.timeEnd('unpack');
                    // выводим последний элемент что бы проверить на валидность
                    console.log(converted[converted.length - 1]);
                    setTimeout(res, 300);
                }
            };
            worker.postMessage(type);
        });
    }
    console.log('Массив ', JSON_TEMPLATE);
    console.log(`Передаем из воркера в главный поток ${ITERATIONS_COUNT} раз`);
    console.group('передаем типизированный массив напрямую');
    await waitResults(0, (data) => ({ data, hash: data.toString() }));
    console.groupEnd();

    console.group('передаем объект напрямую');
    await waitResults(1, (data) => ({ data, hash: JSON.stringify(data) }));
    console.groupEnd();

    console.group('передаем как строку');
    await waitResults(2, (data) => ({ data: JSON.parse(data), hash: data }));
    console.groupEnd();

    console.group('JSON.parse + TextDecoder');
    await waitResults(3, (data) => {
        const hash = decoder.decode(data);
        return { data: JSON.parse(hash), hash };
    });
    console.groupEnd();

    console.group('PBF');
    await waitResults(4, (data) => {
        const unpacked = unpackJson(data);
        return { data: unpacked, hash: JSON.stringify(unpacked) };
    });
    console.groupEnd();
}

setTimeout(makeTests, 300);
