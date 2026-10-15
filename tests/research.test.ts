import assert from 'node:assert/strict';
import test from 'node:test';
import report from '../data/catl-annual-report-2025.json';
import {analyzeClaim} from '../lib/research';
import type {DataResult} from '../lib/finance';
const data:DataResult={mode:'historical',sourceName:report.sourceName,sourceUrl:report.sourceUrl,observedAt:report.recordedAt,reportPeriod:'2024–2025',notice:report.note,records:report.records,apiAttempt:'not_configured'};
test('CATL annual case produces traceable support, contrary and unknown evidence',()=>{const r=analyzeClaim('宁德时代2025年利润增长主要来自主营业务改善，而不是一次性收益。',data);assert.equal(r.supported,true);assert.equal(r.questions.length,4);assert.deepEqual([...new Set(r.evidence.map(e=>e.stance))].sort(),['against','support','unknown']);assert.ok(r.evidence.every(e=>e.url.endsWith(`#page=${e.page}`)));assert.match(r.conclusion,/有限支持/);assert.match(r.conflict,/非经常性损益/)});
test('other issuers do not inherit CATL evidence',()=>{const r=analyzeClaim('某公司2025年利润增长来自主营业务',data);assert.equal(r.supported,false);assert.equal(r.evidence.length,0);assert.match(r.conclusion,/证据不足/)});
test('opposite CATL claims do not inherit the demo conclusion',()=>{const r=analyzeClaim('宁德时代2025年利润增长主要来自一次性收益，而不是主营业务。',data);assert.equal(r.supported,false);assert.equal(r.evidence.length,0)});
