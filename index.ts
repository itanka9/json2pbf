import { unpack } from './src/json2pbf';
import { ITERATIONS_COUNT, JSON_TEMPLATE } from './src/config';
import { unpackBfsm } from './src/bfsm';

const worker = new Worker(new URL('./src/worker.ts', import.meta.url), {
    type: 'module',
  });
const decoder = new TextDecoder('utf-8');

function unpackAndBuildMap(data: ArrayBuffer, columnar = false) {
    const unpacked = unpack(data);
    const map = new Map();
    if (columnar) {
        for (let i = 0; i < unpacked.id.length; i++) {
            const featureState = {
                hidden: unpacked.hidden[i]
            }
            map.set(unpacked.id[i], featureState);

        }
    } else {
        for (let i = 0; i < unpacked.length; i++) {
            const item = unpacked[i];
            const featureState = {
                hidden: item.hidden
            }
            map.set(item.id, featureState);
        }    
    }
    return map;
}

async function makeTests() {
    function waitResults(type: number, unpack: (data: any) => { data: any; }) {
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
    await waitResults(0, (data) => ({ data }));
    console.groupEnd();

    console.group('передаем объект напрямую');
    await waitResults(1, (data) => ({ data }));
    console.groupEnd();

    console.group('передаем как строку');
    await waitResults(2, (data) => ({ data: JSON.parse(data) }));
    console.groupEnd();

    console.group('JSON.parse + TextDecoder');
    await waitResults(3, (data) => {
        const hash = decoder.decode(data);
        return { data: JSON.parse(hash) };
    });
    console.groupEnd();

    console.group('PBF');
    await waitResults(4, (data) => {
        const unpacked = unpackAndBuildMap(data);
        return { data: unpacked };
    });
    console.groupEnd();

    console.group('PBF (row)');
    await waitResults(5, (data) => {
        const unpacked = unpackAndBuildMap(data);
        return { data: unpacked };
    });
    console.groupEnd();

    console.group('PBF (columnar)');
    await waitResults(6, (data) => {
        const unpacked = unpackAndBuildMap(data, true);
        return { data: unpacked };
    });
    console.groupEnd();

    console.group('BFSM');
    await waitResults(7, (data) => {
        const unpacked = unpackBfsm(data);
        return { data: unpacked };
    });
    console.groupEnd();
}

setTimeout(makeTests, 300);
