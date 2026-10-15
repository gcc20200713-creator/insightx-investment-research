# InsightX · AI 投资命题与多证据验证助手

面向需要快速检验投资判断的投研人员与 AI 产品经理的案例版工作台。公开演示：[InsightX](https://insightx-investment-research-yeht.vercel.app)。目前只支持“宁德时代 2025 年利润增长主要来自主营改善而非一次性收益”这一类命题；其他标的、年份及相反主张会显示证据不足。不能据此作投资决策。

## 使用流程与架构

首页输入或修改命题 → 服务端分析范围并生成澄清及四问 → 用户确认检验口径 → 工作台查看数据状态、六项步骤和证据 → 报告查看冲突、边界与结论变化条件 → 在已有证据范围追问、比较与保存。任务保存在当前浏览器 localStorage；刷新首页可直接打开，不支持跨设备同步。

Next.js 15、React 19、TypeScript。主流程在 `POST /api/research` 中顺序执行：命题澄清、问题拆解、工具检索、数据校验、证据分析、结论生成。前两项默认是规则解析；配置百炼北京地域 `DASHSCOPE_API_KEY`、`AI_PROVIDER=dashscope` 时，通过千问 Chat Completions JSON 模式生成澄清和四问；也保留 OpenAI Responses API 分支。通过结构与数字约束校验后采用。模型失败时显示原因并降级规则结果。后四项是服务端代码和年报数据处理，数字、分类、结论不由模型生成。追问是现有证据的关键词查询，不是新一轮模型推理或检索。页面只展示实际执行状态。

## 数据与来源

- `GET /api/financials` 优先由服务端调用扶摇年度利润表：`thscode=300750.SZ&period=annual&limit=4`。校验 `code=0`、标的、年度与关键字段；2024/2025 年数值按元转千元后用于计算。只有本次成功才标为「本次接口调用」。未配置密钥或失败时标为「历史数据」，并显示原因。
- `data/catl-annual-report-2025.json` 是人工摘录的 [宁德时代 2025 年年报](https://static.cninfo.com.cn/finalpage/2026-03-10/1225002214.PDF) 历史数据，不是扶摇原始响应。纸面第 11 页为主要指标，第 12—13 页为非经常性损益，第 117 页为利润表，第 195 页为主营收入和成本。每张证据卡有年份、来源与原文入口。
- 扶摇利润表不含扣非归母净利润，始终取自年报。同比、增量、占比由程序计算。扣非利润与主营业务利润不等价；缺少费用、投资收益、税负及少数股东损益的完整桥接，只能给出有限支持。
- 用户此前提供了完整的 2022—2025 扶摇 JSON；本仓库未取得可逐字段核对的原始正文，故没有把年报摘录伪装为该 JSON 缓存。原响应标识 `request_id=3b706613735540ed825ab502e245eb2c` 仅用于后续核对，不构成已保存原文。2026-10-15 线上 Vercel 已配置密钥并完成真实请求；具体时间、状态码、返回年份与字段摘要见 TESTING.md。仓库不保存密钥或扶摇完整原始响应。

## 本地启动与安全配置

需要 Node.js 20 以上。在项目目录执行 `npm install`，再执行 `npm run dev`，浏览器打开 `http://localhost:3000`。不配置密钥可运行带明确标签的年报历史案例。运行 `npm test` 和 `npm run build` 检查逻辑与构建。

如有密钥，将 `.env.example` 复制为 `.env.local`，仅在本机填 `FUYAO_API_KEY`，以及 `DASHSCOPE_API_KEY`（北京地域）、`AI_PROVIDER=dashscope`、`DASHSCOPE_MODEL=qwen-plus`；OpenAI 为可选分支，重启开发服务。线上通过站点管理页面的服务端环境变量配置同名值，重新部署并测试。不要在聊天、仓库、前端代码或截图中放密钥；变量不带 `NEXT_PUBLIC_` 前缀。`.env*` 被 Git 忽略，只有 `.env.example` 可提交。API 不返回密钥。

## 接口与验证

`GET /api/financials` 返回数据模式、来源、时间、记录和接口状态。`POST /api/research` 接收 `{ "claim": "..." }`，返回研究结构和本次财务数据状态。详见 [TESTING.md](TESTING.md)、[AI_USAGE.md](AI_USAGE.md) 与 [DEMO_SCRIPT.md](DEMO_SCRIPT.md)。

百炼北京地域部署步骤见 [DEPLOYMENT.md](DEPLOYMENT.md)。调用记录包含提供方、模型、请求时间、HTTP状态、耗时和响应ID，不含密钥。2026-10-15 线上千问 qwen-plus 已真实调用成功并通过结构校验；详情见 TESTING.md。

源码仓库：[insightx-investment-research](https://github.com/gcc20200713-creator/insightx-investment-research)。

当前边界：仅单一标的和年度案例；财务 API 和模型 API 已完成一次真实线上调用；没有跨设备保存、完整利润桥接或泛化 Agent 工具规划。部署于 Vercel 的生产域名可匿名访问。
