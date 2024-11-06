import { ITERATIONS_COUNT, JSON_COLUMNS_TEMPLATE, JSON_TEMPLATE } from './config';
import { JsonType, pack, PackMethod } from './json2pbf';
import { packBfsm } from './bfsm';

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
                results[i] = { data: pack(JSON_TEMPLATE) };
            }
            break;
        case 5: 
            for (let i = 0; i < ITERATIONS_COUNT; i++) {
                results[i] = { data: pack(JSON_TEMPLATE, { method: PackMethod.Row, columns: { id: JsonType.String, hidden: JsonType.Boolean } }) };
            }
            break;
        case 6:
            for (let i = 0; i < ITERATIONS_COUNT; i++) {
                results[i] = { data: pack(JSON_COLUMNS_TEMPLATE, { method: PackMethod.Columnar, columns: { id: JsonType.String, hidden: JsonType.Boolean } }) };
            }
            break;
        case 7:
            for (let i = 0; i < ITERATIONS_COUNT; i++) {
                results[i] = packBfsm(JSON_TEMPLATE);
            }
            break;
        default:
            break;
    }
    console.timeEnd('pack');

    if (results[0].data instanceof ArrayBuffer) {
        console.log(`Binary size: ${( results[0].data.byteLength / 10**6).toFixed(3)} MB`);
    } else if ('transfer' in results[0]) {
        console.log(`Binary size: ${( results[0].transfer[0].byteLength / 10**6).toFixed(3)} MB`);
    }

    console.time('send');
    for (let i = 0; i < ITERATIONS_COUNT; i++) {
        if (data instanceof ArrayBuffer) {
            this.postMessage(results[i], { transfer: [data] });
        } else if (data instanceof Float64Array) {
            this.postMessage(results[i], { transfer: [data.buffer] });
        } else if ('transfers' in results[i]) {
            const { data, transfer } = results[i];
            this.postMessage({ data }, { transfer });
        } else {
            this.postMessage(results[i]);
        }
    }
    console.timeEnd('send');
};
