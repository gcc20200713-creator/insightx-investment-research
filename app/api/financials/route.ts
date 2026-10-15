import {NextResponse} from 'next/server';
import {getFinancialData} from '@/lib/finance';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json(await getFinancialData(),{headers:{'Cache-Control':'no-store'}});}
