import { codecs } from './config';

const url = new URL(location.href);
const isDemo = url.searchParams.get('test') === null;

const worker = new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module',
  });

const t = () => performance.now();

async function performTest(type: number, arraySize: number, iterations: number) {

    const codec = codecs[type];

    function waitResults() {
        const results: any[] = [];
        const converted: any[] = [];
        return new Promise<any>((res) => {
            let count = 0;
            let receiveStart = NaN;
            let receiveTime = NaN;
            let unpackStart = NaN;
            let unpackTime = NaN;
            let statsFromWorker: any = undefined;

            worker.onmessage = (evt) => {
                if (count === 0) {
                    receiveStart = t();
                }
                if (!evt.data.data) {
                    statsFromWorker = evt.data;
                    return;
                }
                count++;
                results.push(evt.data.data);
                if (count === iterations) {
                    receiveTime = t() - receiveStart;

                    unpackStart = t();
                    for (let i = 0; i < iterations; i++) {
                        converted.push(codec.unpack(results[i]));
                    }
                    unpackTime= t() - unpackStart;
                    // выводим последний элемент что бы проверить на валидность
                    const last = converted[converted.length - 1].data;
                    setTimeout(() => res({ last, ...statsFromWorker, receiveTime, unpackTime }) , 300);
                }
            };
            worker.postMessage({ codec: type, iterations });
        });
    }

    const testData = codec.makeArray(arraySize);
    worker.postMessage({ testData });
    const { last, ...stats } = await waitResults();
    const equal = JSON.stringify(last) === JSON.stringify(testData);

    if (!equal) {
        console.log(last, testData)
    }
    return { equal, ...stats };
}

(window as any).performTest = performTest;

async function runDemo () {
    const configurations = [
        { arraySize: 10**4, iterations: 100 },
        { arraySize: 10**5, iterations: 100 },
        { arraySize: 10**6, iterations: 10 },
        { arraySize: 10**7, iterations: 1 },
    ];
    for (const { arraySize, iterations } of configurations) {
        const h4 = document.createElement('h4');
        h4.innerText = `Array size: ${arraySize}, iterations: ${iterations}`;
        document.body.appendChild(h4);
        for (let i = 0; i < codecs.length; i++) {
            const div = document.createElement('div');
            div.innerText = codecs[i].name;
            document.body.appendChild(div);
            const pre = document.createElement('pre');
            try {
                pre.innerText = JSON.stringify(await performTest(i, arraySize, iterations), null, 2);
            } catch (err) {
                pre.innerText = '[ERROR] ' + err.message;
            }
            document.body.appendChild(pre);
        }
    }          
}


if (isDemo) {
    runDemo();
}