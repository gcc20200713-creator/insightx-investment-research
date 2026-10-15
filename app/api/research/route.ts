import {NextRequest,NextResponse} from 'next/server';
import {getFinancialData} from '@/lib/finance';
import {analyzeClaim} from '@/lib/research';
import {enhanceWithModel} from '@/lib/ai';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){const body=await req.json().catch(()=>null);const claim=body?.claim;if(typeof claim!=='string'||claim.trim().length<8||claim.length>500)return NextResponse.json({error:'命题长度应为8—500字'}, {status:400});const data=await getFinancialData();const research=await enhanceWithModel(analyzeClaim(claim,data));return NextResponse.json({research,data,dataMode:data.mode,apiAttempt:data.apiAttempt,observedAt:data.observedAt},{headers:{'Cache-Control':'no-store'}})}
