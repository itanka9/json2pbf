import { codecs } from './config';

const t = () => performance.now();

let testData = null;

onmessage = function ({ data }) {
    if (data.testData) {
        testData = data.testData;
        return;
    }

    if (data.codec !== undefined) {
        const codec = codecs[data.codec];
        const iterations = data.iterations;
        const results = new Array<any>(iterations);
        const packStart = t();
        try {
            for (let i = 0; i < iterations; i++) {
                results[i] = codec.pack(testData);
            }    
        } catch (err) {
            for (let i = 0; i < iterations; i++) {
                results[i] = { data: [] }
            }
            console.error(err);
        }
        const packTime = t() - packStart;

        let binarySize = NaN;
    
        if (results[0].data instanceof ArrayBuffer) {
            binarySize = results[0].data.byteLength;
        } else if ('transfer' in results[0]) {
            binarySize = results[0].transfer[0].byteLength;
        }

        const sendStart = t();
        for (let i = 0; i < iterations; i++) {
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
        const sendTime= t() - sendStart;

        this.postMessage({ packTime, sendTime, binarySize });
    }
};
