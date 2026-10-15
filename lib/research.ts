import report from '@/data/catl-annual-report-2025.json';
import {billion,reportUrl,type DataResult,yoy} from './finance';

export type Evidence={id:string;question:string;stance:'support'|'against'|'unknown';title:string;detail:string;interpretation:string;source:string;url:string;page:number;period:string;kind:'原始披露'|'程序计算'|'待验证';};
export type Research={supported:boolean;claim:string;clarification:string;questions:string[];modelUsed?:boolean;modelStatus?:'not_configured'|'success'|'failed'|'not_applicable';modelNotice?:string;tasks:{skill:string;status:'done'|'skipped';detail:string}[];evidence:Evidence[];conclusion:string;conflict:string;limitations:string[];changeConditions:string[];metrics:{name:string;previous:number;current:number;unit:string}[];};
const link=(page:number)=>`${reportUrl}#page=${page}`;
const ev=(id:string,question:string,stance:Evidence['stance'],title:string,detail:string,interpretation:string,page:number,kind:Evidence['kind']='程序计算'):Evidence=>({id,question,stance,title,detail,interpretation,source:report.sourceName,url:link(page),page,period:'2024—2025 年度',kind});

export function analyzeClaim(claim:string,data:DataResult):Research {
  const normalized=claim.trim();
  const supported=/宁德时代|300750/.test(normalized) && /2025/.test(normalized) && /利润|盈利/.test(normalized) && /增长|改善|提升/.test(normalized) && /主营/.test(normalized) && /一次性|非经常/.test(normalized) && !/没有增长|并未增长|利润下降|主要来自一次性|主要由一次性/.test(normalized);
  const questions=['利润是否确实增长？','扣非利润增长能否解释大部分归母利润增量？','主营业务收入与毛利是否改善？','一次性收益及其他因素带来什么反向证据？'];
  const base={supported,claim:normalized,clarification:'检验范围：宁德时代 2025 年相对 2024 年；“主要来自”按归母净利润增量中扣非利润增量占比超过 50% 作操作性判断。扣非增长不能单独证明每一部分均来自主营业务。',questions};
  const tasks:Research['tasks']=[{skill:'命题澄清',status:'done',detail:'规则解析公司、年度与“主要来自”的可检验口径'},{skill:'问题拆解',status:'done',detail:'将命题拆成 4 个子问题'},{skill:'工具检索',status:'done',detail:data.mode==='live'?'本次服务端调用扶摇利润表，并读取年报摘录':'读取已标记的年报历史数据；本次没有成功的扶摇调用'},{skill:'数据校验',status:'done',detail:'校验标的、年度、缺失字段与单位；同比和增量由程序计算'},{skill:'证据分析',status:'done',detail:'按年报披露与程序计算生成支持、反对、待验证卡片'},{skill:'结论生成',status:'done',detail:'依据归母、扣非、非经常性损益与主营毛利的关系生成有边界结论'}];
  if(!supported)return {...base,clarification:'当前案例数据不适用该命题；未生成针对该标的、年度或相反主张的验证问题。',questions:[],tasks:tasks.map((t,i)=>i>0?{...t,status:'skipped' as const,detail:'当前案例数据不适用此命题'}:{...t,detail:'识别命题范围，判定当前案例不适用'}),evidence:[],conclusion:'证据不足：当前规则仅支持“宁德时代2025年利润增长主要来自主营改善而非一次性收益”这一类命题，无法验证其他表述。',conflict:'未对不适用的标的、年度或相反主张进行推断。',limitations:['请使用首页示例命题，或等待扩展命题解析和标的数据。'],changeConditions:['接入命题对应标的、报告期及原始公告后重新运行。'],metrics:[]};
  const cur=data.records.find(r=>r.fiscalYear===2025),prior=data.records.find(r=>r.fiscalYear===2024);
  if(!cur||!prior||cur.parentNetProfit===null||prior.parentNetProfit===null||cur.adjustedParentNetProfit===null||prior.adjustedParentNetProfit===null) return {...base,tasks,evidence:[],conclusion:'证据不足：关键年度或扣非利润缺失，暂不形成结论。',conflict:'数据不完整，无法比较。',limitations:['缺少关键财务数据。'],changeConditions:['补齐2024与2025年的归母及扣非利润。'],metrics:[]};
  const netDelta=cur.parentNetProfit-prior.parentNetProfit;
  const adjustedDelta=cur.adjustedParentNetProfit-prior.adjustedParentNetProfit;
  const nonrec=report.additional.nonRecurringNetProfit;
  const nonrecDelta=nonrec['2025']-nonrec['2024'];
  const share=netDelta===0?null:adjustedDelta/netDelta*100;
  const revenue=report.additional.mainBusinessRevenue,cost=report.additional.mainBusinessCost;
  const gross25=revenue['2025']-cost['2025'],gross24=revenue['2024']-cost['2024'];
  const evidence:Evidence[]=[
    ev('net','利润是否确实增长？','support','归母净利润增长',`2025 年 ${billion(cur.parentNetProfit)} 亿元，2024 年 ${billion(prior.parentNetProfit)} 亿元，同比 ${yoy(cur.parentNetProfit,prior.parentNetProfit)?.toFixed(2)}%，增加 ${billion(netDelta)} 亿元。`,'确认利润增长这一前提；尚不能据此判断增长来源。',11),
    ev('adjusted','扣非利润增长能否解释大部分归母利润增量？',share!==null&&share>50?'support':'unknown','扣非利润增量占比',`扣非归母净利润增加 ${billion(adjustedDelta)} 亿元，占归母利润增量 ${share?.toFixed(1)??'—'}%；扣非利润同比 ${yoy(cur.adjustedParentNetProfit,prior.adjustedParentNetProfit)?.toFixed(2)}%。`,'扣非利润增长解释了大部分归母利润增量，但“扣非”与“主营”并非完全等价。',11),
    ev('gross','主营业务收入与毛利是否改善？','support','主营业务毛利增长',`主营业务收入 ${billion(revenue['2024'])} → ${billion(revenue['2025'])} 亿元；收入减成本所得主营毛利 ${billion(gross24)} → ${billion(gross25)} 亿元，增加 ${billion(gross25-gross24)} 亿元。`,'主营经营层面有改善；主营毛利尚未扣除期间费用、所得税与少数股东损益，不能直接等同于归母利润增量。',195),
    ev('nonrec','一次性收益及其他因素带来什么反向证据？','against','非经常性损益也在增加',`非经常性损益归母净额 ${billion(nonrec['2024'])} → ${billion(nonrec['2025'])} 亿元，增加 ${billion(nonrecDelta)} 亿元，约占归母利润增量 ${netDelta===0?'—':(nonrecDelta/netDelta*100).toFixed(1)+'%'}。`,'存在一次性收益推动，不能说完全没有贡献；但按当前口径不是利润增量的主要来源。',12),
    ev('description','一次性收益及其他因素带来什么反向证据？','against','年报披露股权投资相关收益',report.additional.nonRecurringDescription,'这部分收益属于反向证据；应保留其性质说明，不以营业利润增长直接代表主营改善。',13,'原始披露'),
    ev('unknown','一次性收益及其他因素带来什么反向证据？','unknown','主营改善的逐项归因尚不完整','当前仅比较主营毛利、扣非利润和非经常性损益，未建立从主营毛利到归母净利润的完整费用、投资收益、所得税及少数股东损益桥接。','因此可判断一次性损益不是增量主因，但不应将扣非利润的每一元增量都归因于主营业务。',117,'待验证')
  ];
  return {...base,tasks,evidence,conclusion:share!==null&&share>50?`有限支持：2025 年归母利润增加 ${billion(netDelta)} 亿元，其中扣非利润增加 ${billion(adjustedDelta)} 亿元，占增量 ${share.toFixed(1)}%。主营业务毛利同步增长。一次性收益也贡献 ${billion(nonrecDelta)} 亿元，因此更准确的表述是“利润增长主要伴随经常性盈利及主营经营改善，非经常性损益并非增量主因”，尚不能完成严格的逐项因果归因。`:'暂不支持：扣非利润增量未超过归母利润增量的一半。',conflict:`归母利润增长与非经常性损益上升同时存在。以年报披露的归母、扣非口径计算，增量分别为 ${billion(netDelta)} 和 ${billion(adjustedDelta)} 亿元，两者差额约 ${billion(nonrecDelta)} 亿元；这解释了反对证据为何不推翻“主要来自经常性改善”的有限判断。`,limitations:['扣非净利润是经常性盈利的近似口径，不能直接等同于主营业务利润。','主营毛利至归母利润的费用、投资收益、税负及少数股东损益桥接尚未完成。','年报历史数据和实时接口状态应分开理解。'],changeConditions:['如年报更正或后续公告调整归母、扣非及非经常性损益口径，重新计算贡献比例。','如完整利润桥接显示投资收益、费用或税项而非主营毛利主导增长，应下调结论。'],metrics:[{name:'归母净利润',previous:prior.parentNetProfit,current:cur.parentNetProfit,unit:'千元'},{name:'扣非归母净利润',previous:prior.adjustedParentNetProfit,current:cur.adjustedParentNetProfit,unit:'千元'},{name:'非经常性损益归母净额',previous:nonrec['2024'],current:nonrec['2025'],unit:'千元'},{name:'主营业务毛利',previous:gross24,current:gross25,unit:'千元'}]};
}
