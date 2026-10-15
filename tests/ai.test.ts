import assert from 'node:assert/strict';
import test from 'node:test';
import report from '../data/catl-annual-report-2025.json';
import {analyzeClaim} from '../lib/research';
import {enhanceWithModel} from '../lib/ai';
import type {DataResult} from '../lib/finance';
const data:DataResult={mode:'historical',sourceName:report.sourceName,sourceUrl:report.sourceUrl,observedAt:report.recordedAt,reportPeriod:'2024–2025',notice:report.note,records:report.records,apiAttempt:'not_configured'};
test('optional model can rephrase but cannot alter evidence or numeric conclusion',async()=>{const key=process.env.OPENAI_API_KEY,original=globalThis.fetch;process.env.OPENAI_API_KEY='test-only';globalThis.fetch=async()=>new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify({clarification:'检验宁德时代2025年相对2024年的利润来源',questions:['利润如何变化？','扣非贡献多少？','主营毛利如何变化？','一次性收益贡献多少？']})}]}]}));try{const baseline=analyzeClaim('宁德时代2025年利润增长主要来自主营业务改善，而不是一次性收益。',data);const result=await enhanceWithModel(baseline);assert.equal(result.modelUsed,true);assert.deepEqual(result.evidence,baseline.evidence);assert.equal(result.conclusion,baseline.conclusion);assert.match(result.clarification,/超过50%/)}finally{globalThis.fetch=original;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key}});
test('model HTTP error is visibly marked as rule fallback',async()=>{const key=process.env.OPENAI_API_KEY,original=globalThis.fetch;process.env.OPENAI_API_KEY='test-only';globalThis.fetch=async()=>new Response('unavailable',{status:503});try{const baseline=analyzeClaim('宁德时代2025年利润增长主要来自主营业务改善，而不是一次性收益。',data);const result=await enhanceWithModel(baseline);assert.equal(result.modelStatus,'failed');assert.match(result.modelNotice??'',/HTTP 503.*规则结果/);assert.deepEqual(result.evidence,baseline.evidence)}finally{globalThis.fetch=original;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key}});

test('Beijing Qwen call uses server endpoint and keeps financial evidence code-owned',async()=>{
  const old={provider:process.env.AI_PROVIDER,key:process.env.DASHSCOPE_API_KEY,model:process.env.DASHSCOPE_MODEL},original=globalThis.fetch;
  process.env.AI_PROVIDER='dashscope';process.env.DASHSCOPE_API_KEY='test-only';process.env.DASHSCOPE_MODEL='qwen-plus';
  globalThis.fetch=async(url,init)=>{assert.equal(String(url),'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions');const request=JSON.parse(init?.body as string);assert.equal(request.response_format.type,'json_object');assert.equal(request.enable_thinking,false);assert.match(request.messages[0].content,/JSON/);return new Response(JSON.stringify({id:'mock-qwen-response',choices:[{message:{content:JSON.stringify({clarification:'核验宁德时代2025年相对2024年的利润来源',questions:['利润增幅怎样？','扣非利润增量贡献多大？','主营毛利有何变化？','非经常损益带来哪些反向证据？']})}}]}))};
  try{const baseline=analyzeClaim('宁德时代2025年利润增长主要来自主营业务改善，而不是一次性收益。',data),result=await enhanceWithModel(baseline);assert.equal(result.modelStatus,'success');assert.equal(result.modelRun?.httpStatus,200);assert.equal(result.modelRun?.responseId,'mock-qwen-response');assert.match(result.modelRun?.provider??'',/北京/);assert.deepEqual(result.evidence,baseline.evidence);assert.equal(result.conclusion,baseline.conclusion)}finally{globalThis.fetch=original;for(const [name,value] of Object.entries({AI_PROVIDER:old.provider,DASHSCOPE_API_KEY:old.key,DASHSCOPE_MODEL:old.model})){if(value===undefined)delete process.env[name];else process.env[name]=value}}
});

test('Qwen invented numbers and malformed structure cannot replace rule results',async()=>{
  const old={provider:process.env.AI_PROVIDER,key:process.env.DASHSCOPE_API_KEY},original=globalThis.fetch;process.env.AI_PROVIDER='dashscope';process.env.DASHSCOPE_API_KEY='test-only';
  try{const baseline=analyzeClaim('宁德时代2025年利润增长主要来自主营业务改善，而不是一次性收益。',data);
    for(const content of [JSON.stringify({clarification:'利润增长99%',questions:['a','b','c','d']}),JSON.stringify({clarification:'检验利润',questions:['a','a','c','d']}),'invalid json']){
      globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content}}]}));const result=await enhanceWithModel(baseline);assert.equal(result.modelStatus,'failed');assert.equal(result.modelUsed,false);assert.equal(result.clarification,baseline.clarification);assert.deepEqual(result.evidence,baseline.evidence);
    }
  }finally{globalThis.fetch=original;for(const [name,value] of Object.entries({AI_PROVIDER:old.provider,DASHSCOPE_API_KEY:old.key})){if(value===undefined)delete process.env[name];else process.env[name]=value}}
});

test('missing Qwen key never performs a simulated live model request',async()=>{
  const old={provider:process.env.AI_PROVIDER,key:process.env.DASHSCOPE_API_KEY},original=globalThis.fetch;process.env.AI_PROVIDER='dashscope';delete process.env.DASHSCOPE_API_KEY;globalThis.fetch=async()=>{throw new Error('must not call')};
  try{const result=await enhanceWithModel(analyzeClaim('宁德时代2025年利润增长主要来自主营业务改善，而不是一次性收益。',data));assert.equal(result.modelStatus,'not_configured');assert.equal(result.modelRun,undefined);assert.match(result.modelNotice??'',/DASHSCOPE_API_KEY/)}finally{globalThis.fetch=original;for(const [name,value] of Object.entries({AI_PROVIDER:old.provider,DASHSCOPE_API_KEY:old.key})){if(value===undefined)delete process.env[name];else process.env[name]=value}}
});
