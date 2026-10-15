import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'InsightX | 投资命题研究',description:'投资命题与多证据验证工作台'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
