import report from '@/data/catl-annual-report-2025.json';

export type Metric = 'operatingIncome'|'operatingProfit'|'parentNetProfit'|'adjustedParentNetProfit';
export type RecordYear = { fiscalYear:number; operatingIncome:number|null; operatingProfit:number|null; parentNetProfit:number|null; adjustedParentNetProfit:number|null; page?: Partial<Record<Metric,number>> };
export type DataResult = { mode:'live'|'historical'; sourceName:string; sourceUrl:string; observedAt:string; reportPeriod:string; notice:string; records:RecordYear[]; apiAttempt:'success'|'not_configured'|'failed'; error?:string; apiRun?:{requestedAt:string;durationMs:number;httpStatus?:number;returnedYears:number[];returnedFields:string[];validation:'not_completed'|'matched'|'conflict'} };
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
  const fallback=historical(),key=process.env.FUYAO_API_KEY;
  if (!key) return fallback;
  const requestedAt=new Date().toISOString(),started=Date.now();
  const apiRun:NonNullable<DataResult['apiRun']>={requestedAt,durationMs:0,returnedYears:[],returnedFields:[],validation:'not_completed'};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
  try {
    const response=await fetch('https://fuyao.aicubes.cn/api/a-share/financials/income-statements?thscode=300750.SZ&period=annual&limit=4',{headers:{'X-api-key':key},cache:'no-store',signal:controller.signal});
    apiRun.httpStatus=response.status;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload=await response.json();
    const items=payload&&typeof payload==='object'&&Array.isArray(payload.data?.item)?payload.data.item:[];
    apiRun.returnedYears=[...new Set<number>(items.map((x:{fiscal_year?:unknown})=>x?.fiscal_year).filter((x:unknown):x is number=>typeof x==='number'&&Number.isInteger(x)&&x>=1900&&x<=2100))].sort();
    apiRun.returnedFields=[...new Set<string>(items.flatMap((x:unknown)=>x&&typeof x==='object'?Object.keys(x):[]))].filter(x=>/^[A-Za-z_][A-Za-z0-9_]{0,60}$/.test(x)).sort();
    const records=normalizeFuyao(payload);
    // This case cites the annual report. Stop live substitution if the same fields conflict.
    const fields=['operatingIncome','operatingProfit','parentNetProfit'] as const;
    if(records.some(row=>{const original=report.records.find(x=>x.fiscalYear===row.fiscalYear);return !original||fields.some(field=>row[field]===null||Math.abs(row[field]!-original[field])>1)})){
      apiRun.validation='conflict';throw new Error('接口值与案例年报同口径数据不一致，需人工核对');
    }
    apiRun.validation='matched';apiRun.durationMs=Date.now()-started;
    return {mode:'live',sourceName:'同花顺扶摇 · A股年度利润表',sourceUrl:'https://fuyao.aicubes.cn/api/a-share/financials/income-statements?thscode=300750.SZ&period=annual&limit=4',observedAt:new Date().toISOString(),reportPeriod:'2024–2025 年度',notice:'本次服务端调用扶摇API，并与案例年报同字段核对通过；扣非归母净利润取自年报。',apiAttempt:'success',apiRun,records:records.map(r=>({...r,adjustedParentNetProfit:report.records.find(h=>h.fiscalYear===r.fiscalYear)?.adjustedParentNetProfit??null,page:{adjustedParentNetProfit:11}}))};
  }catch(e){
    apiRun.durationMs=Date.now()-started;
    const message=e instanceof Error?e.message:'';
    const allowed=['响应不是对象','接口返回业务错误或数据格式不符','2024/2025年度关键字段缺失','接口值与案例年报同口径数据不一致，需人工核对'];
    const error=/^HTTP \d{3}$/.test(message)||allowed.includes(message)?message:e instanceof Error&&e.name==='AbortError'?'请求超时':'网络或数据读取失败';
    return {...fallback,apiAttempt:'failed',apiRun,error,notice:apiRun.validation==='conflict'?'扶摇返回值与案例年报核对不一致，待人工确认；以下仅展示已注明来源的年报历史数据。':'扶摇接口调用或数据校验失败，以下为2025年年报摘录的历史数据。'};
  }finally{clearTimeout(timer)}
}
