import { test, expect } from '@playwright/test';
import { codecs } from '../demo/config';

type Configuration = { arraySize: number, iterations: number, thresolds: { packTime: number, unpackTime: number, sendTime: number, receiveTime: number } };  

const configurations: Configuration[] = [
  { arraySize: 10**4, iterations: 1000, thresolds: { packTime: 3000, unpackTime: 3000, sendTime: 100, receiveTime: 100 } },
  { arraySize: 10**5, iterations: 100, thresolds: { packTime: 3000, unpackTime: 3000, sendTime: 100, receiveTime: 100 } },
  { arraySize: 10**6, iterations: 10, thresolds: { packTime: 6000, unpackTime: 6000, sendTime: 100, receiveTime: 100 } },
  { arraySize: 10**7, iterations: 1, thresolds: { packTime: 6000, unpackTime: 6000, sendTime: 100, receiveTime: 100 } },
]

for (let i = 0; i < codecs.length; i++) {
  test.describe(codecs[i].name, () => {
    for (const { arraySize, iterations, thresolds } of configurations) {
      test(`size: ${arraySize}, iterations: ${iterations}`, async ({ page }) => {
        await page.goto('/?test');
        const result = await page.evaluate(
          ([codec, arraySize, iterations]) => (window as any).performTest(codec, arraySize, iterations),
          [i, arraySize, iterations]
        );
        expect(result.equal).toBe(true);
        for (const name in thresolds) {
          expect(result[name], name).toBeLessThan(thresolds[name]);
        }
      });    
    }  
  })
}


