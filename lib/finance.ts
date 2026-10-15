import report from '@/data/catl-annual-report-2025.json';

export type Metric = 'operatingIncome'|'operatingProfit'|'parentNetProfit'|'adjustedParentNetProfit';
export type RecordYear = { fiscalYear:number; operatingIncome:number|null; operatingProfit:number|null; parentNetProfit:number|null; adjustedParentNetProfit:number|null; page?: Partial<Record<Metric,number>> };
export type DataResult = { mode:'live'|'historical'; sourceName:string; sourceUrl:string; observedAt:string; reportPeriod:string; notice:string; records:RecordYear[]; apiAttempt:'success'|'not_configured'|'failed'; error?:string };
export const reportUrl = report.sourceUrl;

const historical = ():DataResult => ({mode:'historical',sourceName:report.sourceName,sourceUrl:report.sourceUrl,observedAt:report.recordedAt,reportPeriod:'2024–2025 年年报',notice:report.note,records:report.records,apiAttempt:'not_configured'});
const asNumber = (x:unknown):number|null => typeof x==='number' && Number.isFinite(x) ? x : null;
export function normalizeFuyao(payload:unknown):RecordYear[] {
  if (!payload || typeof payload!=='object') throw new Error('响应不是对象');
  const envelope=payload as {code?:unknown; data?:{item?:unknown}};
  if (envelope.code!==0 || !Array.isArray(envelope.data?.item)) throw new Error('接口返回业务错误或数据格式不符');
  const rows:RecordYear[]=envelope.data.item.filter((x):x is Record<string,unknown>=>!!x && typeof x==='object' && !Array.isArray(x))
    .filter(x=>x.thscode==='300750.SZ' && x.period==='annual' && (x.fiscal_year===2024 || x.fiscal_year===2025))
    .map(x=>({fiscalYear:x.fiscal_year as number,operatingIncome:asNumber(x.operating_income)===null?null:(x.operating_income as number)/1000,operatingProfit:asNumber(x.operating_profit)===null?null:(x.operating_profit as number)/1000,parentNetProfit:asNumber(x.parent_holder_net_profit)===null?null:(x.parent_holder_net_profit as number)/1000,adjustedParentNetProfit:null}));
  if (![2024,2025].every(year=>rows.some(r=>r.fiscalYear===year && r.operatingIncome!==null && r.operatingProfit!==null && r.parentNetProfit!==null))) throw new Error('2024/2025年度关键字段缺失');
  return rows.sort((a,b)=>b.fiscalYear-a.fiscalYear);
}
export function yoy(current:number|null,previous:number|null):number|null {
  return current===null || previous===null || previous===0 ? null : (current-previous)/Math.abs(previous)*100;
}
export function billion(value:number|null):string { return value===null?'—':(value/100000).toFixed(2); }
export async function getFinancialData():Promise<DataResult> {
  const fallback=historical();
  const key=process.env.FUYAO_API_KEY;
  if (!key) return fallback;
  try {
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),7000);
    let response:Response;
    try { response=await fetch('https://fuyao.aicubes.cn/api/a-share/financials/income-statements?thscode=300750.SZ&period=annual&limit=4',{headers:{'X-api-key':key},cache:'no-store',signal:controller.signal}); }
    finally { clearTimeout(timer); }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const records=normalizeFuyao(await response.json());
    return {mode:'live',sourceName:'同花顺扶摇 · A股年度利润表',sourceUrl:'https://fuyao.aicubes.cn/docs/',observedAt:new Date().toISOString(),reportPeriod:'2024–2025 年度',notice:'本次由服务端调用扶摇API；扣非归母净利润取自年报原文。',apiAttempt:'success',records:records.map(r=>({...r,adjustedParentNetProfit:report.records.find(h=>h.fiscalYear===r.fiscalYear)?.adjustedParentNetProfit??null,page:{adjustedParentNetProfit:11}}))};
  } catch(e) {return {...fallback,apiAttempt:'failed',error:e instanceof Error?e.message:'未知接口错误',notice:'扶摇接口调用失败，以下为2025年年报摘录的历史数据。'};}
}
