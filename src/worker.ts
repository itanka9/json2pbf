import { ITERATIONS_COUNT, JSON_TEMPLATE } from './config';
import { packJson } from './json2pbf';

const oldMsgTemplate = new Float64Array(JSON_TEMPLATE as any);

const encoder = new TextEncoder();
onmessage = function ({ data }) {
    const results = new Array<any>(ITERATIONS_COUNT);
    console.time('pack');
    switch (data) {
        case 0:
            for (let i = 0; i < ITERATIONS_COUNT; i++) {
                results[i] = { data: oldMsgTemplate };
            }
            break;
        case 1:
            for (let i = 0; i < ITERATIONS_COUNT; i++) {
                results[i] = { data: JSON_TEMPLATE };
            }
            break;
        case 2:
            for (let i = 0; i < ITERATIONS_COUNT; i++) {
                results[i] = { data: JSON.stringify(JSON_TEMPLATE) };
            }
            break;
        case 3:
            for (let i = 0; i < ITERATIONS_COUNT; i++) {
                results[i] = { data: encoder.encode(JSON.stringify(JSON_TEMPLATE)) };
            }
            break;
        case 4:
            for (let i = 0; i < ITERATIONS_COUNT; i++) {
                results[i] = { data: packJson(JSON_TEMPLATE) };
            }
            break;
        default:
            break;
    }
    console.timeEnd('pack');

    console.time('send');
    for (let i = 0; i < ITERATIONS_COUNT; i++) {
        //@ts-ignore
        postMessage(results[i]);
    }
    console.timeEnd('send');
};
