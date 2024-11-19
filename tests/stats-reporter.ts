import type {
    Reporter, TestCase, TestResult
} from '@playwright/test/reporter';

class StatsReporter implements Reporter {
    private results: Record<string, Record<string, string>> = {};

    onBegin() {
        this.results = {}
    }

    onTestEnd(_test: TestCase, result: TestResult) {
        if (!result.attachments[0] || !result.attachments[0].body) {
            return;
        }
        const body = result.attachments[0].body as any;
        const stats = JSON.parse(body);
        if (!this.results[stats.codec]) {
            this.results[stats.codec] = {};
        }
        
        const { packTime, unpackTime, receiveTime, sendTime } = stats;
        const total = packTime + unpackTime + receiveTime + sendTime;

        const fmt = (n: number) => ('      '+Math.trunc(n)).slice(-6);

        this.results[stats.codec][stats.case] = `${fmt(total)} (pack: ${fmt(packTime)}, unpack: ${fmt(unpackTime)}, receive: ${fmt(receiveTime)}, send: ${fmt(sendTime)})`;
    }

    onEnd() {
        for (const codec in this.results) {
            console.log(`${codec}:`)
            const codecStats = this.results[codec];
            for (const case_ in codecStats) {
                const caseStats = codecStats[case_];
                console.log(`\t${case_}:\t${caseStats}`);
            }
        }
    }
}
  
export default StatsReporter;