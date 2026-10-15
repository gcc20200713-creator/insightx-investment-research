# InsightX · AI 投资命题与多证据验证助手

面向投资研究者的 48 小时实战项目。当前有可运行主链路：命题输入与修订、范围澄清、4 个子问题、年度财务数据读取、三类证据卡片、研究结论、简化指标比较、限定范围的追问及本机保存。

当前主流程由**服务端规则引擎**调度六项 Skill。可选配置 `OPENAI_API_KEY`，由模型辅助命题澄清与四问表述；证据数字、分类及结论仍由代码和原始材料决定。未配置或模型失败时回退规则解析，页面不会伪装模型调用。示例只支持宁德时代 2025 年相对 2024 年利润增长命题；其他标的或年份返回证据不足。模型调用尚未用真实 Key 验证。

## 本地启动

1. 安装 Node.js 20 或更高版本。
2. 在项目目录执行 `npm install`、`npm run dev`。
3. 浏览器打开 `http://localhost:3000`。不配置密钥也能看到明确标记为「历史数据」的年报案例。

若有扶摇 API Key，在项目根目录复制 `.env.example` 为 `.env.local`，只在本机把密钥填入 `FUYAO_API_KEY=` 后重启服务。若需要模型辅助澄清，再填 `OPENAI_API_KEY=`。不要在聊天、截图或仓库中公开密钥。部署时在平台的 Environment Variables 中配置同名变量。前端和 API 响应不包含密钥。`.env*` 已被 Git 忽略（`.env.example` 例外）。

## 数据与边界

- `GET /api/financials` 服务端请求 `GET https://fuyao.aicubes.cn/api/a-share/financials/income-statements?thscode=300750.SZ&period=annual&limit=4`，校验 `code=0`、标的、年度和关键字段。成功显示「本次接口调用」及请求时间；没有密钥或失败显示「历史数据」及原因。`POST /api/research` 接收 `{ "claim": "..." }`，返回研究结构、数据模式和接口状态。
- `data/catl-annual-report-2025.json` 是人工摘录的**年报历史数据**，不是 API 原始返回，不标为实时。数据来源为[宁德时代 2025 年年报](https://static.cninfo.com.cn/finalpage/2026-03-10/1225002214.PDF)，纸面第 11 页主要财务指标、第 117 页合并利润表。2025、2024 的收入、营业利润、归母净利润及扣非净利润均有原文可查。
- 扶摇利润表的 `parent_holder_net_profit` 对应年报归母净利润；扶摇数值按元转为千元后与历史年报统一。扣非归母净利润单独取年报，不虚构扶摇字段。同比由代码计算，展示时再从千元转成亿元。
- `data/catl-annual-report-2025.json` 另有年报第 12—13 页非经常性损益与第 195 页主营收入、成本摘录。非经常性损益归母增量与扣非利润增量以代码计算，并明确区分“扣非”与“主营”。
- 当前只支持宁德时代年度案例。任意文字可作为命题草稿展示，但**不会对其他标的开展研究**。本次无大模型 Key 时没有模型调用；配置后模型仅辅助澄清与拆解。工具状态记录实际服务端数据模式与规则运行，不构造不存在的外部检索轨迹。追问仅匹配已有证据，不生成新事实。保存采用当前浏览器 localStorage，清理浏览器后可能丢失。
- 用户之前提到的扶摇原始响应未完整出现在当前可用资料中，因此**没有把人工重建的数据冒充原始 API 响应缓存**。若配置真实 API Key，可实时读取；年报摘录是单独标注的历史回退。

## 验证

`npm test` 验证公式、接口格式、证据三分类及不适用标的；`npm run build` 验证 TypeScript 与生产构建；`curl http://localhost:3000/api/financials` 验证服务端数据状态。接口无密钥、异常及字段缺失应切换至历史数据，不能标为实时。详见 `TESTING.md`。

## 尚待完成

真实 Key 验证可配置的大模型澄清能力；保留经完整验证的扶摇原始响应缓存；扩展更多标的与报告期，以及创建 GitHub 仓库和公网部署。发布前在部署平台配置密钥，不要把密钥加入仓库。

## GitHub 与 Vercel 发布步骤

当前工作区没有连接 GitHub 与 Vercel，因此没有公网地址或远程仓库。连接后可以按下列顺序发布：

1. 在 GitHub 新建空仓库 `InsightX`，不要勾选“Add a README”；在本地项目目录运行 `git remote add origin https://github.com/<用户名>/InsightX.git`、`git push -u origin main`。如果使用本项目 ZIP，解压后先运行 `git init`、`git add .`、`git commit -m "Initial InsightX"`、`git branch -M main`。GitHub 登录在浏览器或凭据管理器中完成，不把令牌放在聊天或命令文本里。
2. 登录 Vercel，选择 **Add New → Project → Import Git Repository**，选中 `InsightX`。Framework Preset 选择 Next.js，Root Directory 保持项目根目录。
3. 在项目 **Settings → Environment Variables** 新建 `FUYAO_API_KEY`，值只在 Vercel 密钥输入框中填写，Environment 选 Production 和 Preview。可选另设 `OPENAI_API_KEY`。没有 Key 也可先发布年报历史数据与规则解析版，但页面会明确显示“历史数据”和“未调用大模型”。
4. 点击 Deploy。成功后从 Vercel 页面复制分配的 `https://...vercel.app` 地址。打开首页，输入示例命题，查看 `/api/financials` 的 `mode` 和 `/api/research` 的证据。确认发布页面实际状态与 README 一致后提交链接。

部署日志和截图中也不要显示 Key。`FUYAO_API_KEY` 不带 `NEXT_PUBLIC_` 前缀，仅服务端读取。
