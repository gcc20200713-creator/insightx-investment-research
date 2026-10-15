import {getFinancialData} from '@/lib/finance';
import Workspace from '@/components/Workspace';
export const dynamic='force-dynamic';
export default async function Home(){const data=await getFinancialData();return <Workspace initialData={data}/>}
