import { test, expect } from '@playwright/test';
import { codecs } from '../demo/config';
import { packJson, unpackJson } from 'src/json2pbf';
import { existsSync, readFileSync, writeFileSync } from 'fs';

type Configuration = { arraySize: number, iterations: number };  

const configurations: Configuration[] = [
  { arraySize: 10**4, iterations: 1000 },
  { arraySize: 10**5, iterations: 100 },
  { arraySize: 10**6, iterations: 10},
  { arraySize: 10**7, iterations: 1 },
]

for (let i = 0; i < codecs.length; i++) {
  test.describe(codecs[i].name, () => {
    for (const { arraySize, iterations } of configurations) {
      test(`size: ${arraySize}, iterations: ${iterations}`, async ({ page }, testInfo) => {
        await page.goto('/?test');
        const result = await page.evaluate(
          ([codec, arraySize, iterations]) => (window as any).performTest(codec, arraySize, iterations),
          [i, arraySize, iterations]
        );
        expect(result.equal).toBe(true);

        testInfo.attach('stats', {
          body: JSON.stringify({ codec: codecs[i].name, case: `10**${Math.log10(arraySize)} x ${iterations}`, ...result }), 
          contentType: 'application/json'}
        )
      });    
    }  
  })
}

test.describe('basic cases', () => {
  const equalityCases = [
    null,
    1, 
    0, 
    true,
    false,
    { foo: 'bar' },
    [1, 2, 3, 4, 5],
    { foo: { bar: 'baz', quux: [0, 4, 1] } }
  ]
  for (const content of equalityCases) {
    test(`pack(unpack(${JSON.stringify(content)})) === ${JSON.stringify(content)}`, () => {
      expect(unpackJson(packJson(content))).toStrictEqual(content)
    });
  }

  const versions = [1];

  const serializeCases = [
    { foo: 'bar' },
    [1, 2, 3, 4, 5],
    { foo: { bar: 'baz', quux: [0, 4, 1] } },
    [
      { id: 'foobarbazz', hidden: true},
      { id: 'blah-blah-blah', hidden: false },
      { id: '234029384203', hidden: true },
    ]
  ]
  for (const version of versions) {
    for (let i = 0; i < serializeCases.length; i++) {
      const caseData = serializeCases[i];
      test(`unpack of ${i} v${version} is stable`, () => {
        const caseSnap = `./tests/snaps/${version}-${i}.blob`;
        // if (!existsSync(caseSnap)) {
        //   writeFileSync(caseSnap, new Buffer(packJson(caseData)));
        // }

        const blob = readFileSync(caseSnap);
        expect(unpackJson(blob)).toStrictEqual(caseData);
      });    
    }
  }
});