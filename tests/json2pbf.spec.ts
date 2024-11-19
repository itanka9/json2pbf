import { test, expect } from '@playwright/test';
import { codecs } from '../demo/config';

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


