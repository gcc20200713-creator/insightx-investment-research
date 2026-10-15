# InsightX 测试记录（2026-10-15，北京时间）

生产站点：https://insightx-investment-research-yeht.vercel.app ；源码：https://github.com/gcc20200713-creator/insightx-investment-research 。本次记录同时区分真实线上调用、浏览器操作与模拟异常测试。

## 生产环境真实调用

对公开生产域名发送 `POST /api/research`，请求体是宁德时代 2025 年案例命题。接口响应 HTTP 200，端到端约 12.14 秒，未带登录凭据。响应不含密钥。

| 调用 | 请求时间（UTC） | 状态及耗时 | 实际返回摘要 | 校验 |
| --- | --- | --- | --- | --- |
| 扶摇年度利润表 `300750.SZ, annual, limit=4` | 2026-10-15T12:15:44.922Z | HTTP 200；2413 ms | 2022、2023、2024、2025；`fiscal_year`, `operating_income`, `operating_profit`, `parent_holder_net_profit` 等 21 个字段名 | 2024/2025 三项利润表指标与年报摘录相符，`validation=matched`，`dataMode=live` |
| 阿里云百炼北京地域 `qwen-plus` | 2026-10-15T12:15:47.337Z | HTTP 200；5991 ms | 四个结构化子问题；响应 ID `chatcmpl-5edb1161-ee95-95fe-b1e1-c8a5a12cec4a` | 结构校验通过，`modelUsed=true`, `modelStatus=success` |

扶摇返回字段名摘要：`basic_eps`, `currency`, `fiscal_period`, `fiscal_year`, `income_tax_expense`, `interest_expenses`, `manage_fee`, `net_profit`, `operating_costs`, `operating_expenses`, `operating_income`, `operating_profit`, `parent_holder_net_profit`, `period`, `period_end_ms`, `profit_total`, `report_date_ms`, `research_and_development_expenses`, `sales_fee`, `thscode`, `ticker`。没有保存或上传本次完整财务 JSON；元数据由服务端响应记录。另一浏览器点击研究时显示百炼 HTTP 200、2026-10-15T12:16:32.350Z、6017 ms，响应 ID `chatcmpl-49fc8cdf-3f52-9c2a-aaae-03251cff6737`。

## 实际浏览器验收

| 场景 | 操作与结果 |
| --- | --- |
| 匿名访问 | 不带登录状态请求生产域名，首页 HTTP 200；云浏览器打开首页，未要求登录。预览部署域名带 Vercel SSO，提交使用上述生产域名。 |
| 主链路 | 点击“开始研究”，显示实际扶摇接口调用与百炼辅助澄清、四问；点击“确认命题并查看证据”，展示六步执行记录和 3 条支持、2 条反对、1 条无法验证证据。 |
| 来源追溯 | 点击证据“查看原文”，新标签页打开年报 PDF `#page=11`；其余证据显示第 12、13、117、195 页链接，未逐一点击。 |
| 报告与比较 | 点击“研究报告”，显示有限支持、反向证据和冲突解释、尚未验证、改变结论的条件，以及 2024/2025 四行指标比较。 |
| 追问 | 输入“一次性收益占利润增量多少？”，返回已存在证据中非经常性损益增量 19.42 亿元、约占 9.0%；该功能不是新的模型调用。 |
| 保存恢复 | 点击“保存研究任务”，按钮变为“已保存到本机”；刷新首页后显示保存记录，点击可重新打开原研究。仅当前浏览器 localStorage。 |

## 本地逻辑与异常测试

`npm test`：13/13 通过；`npm run build`：通过（Node.js 24、Next.js 15.5.12）。测试覆盖单位、同比、证据分类、扶摇业务错误 `code=2001`、缺失 2024 年、API 与年报冲突时回退、百炼无效 JSON / 重复问题 / 不可信数字、无 Key 不发请求、其他标的和相反命题不套用案例。异常均为模拟测试，**未在生产环境人为触发**。此前 Sites 站点中测试过历史数据标签与越界显示；本次 Vercel 生产环境的无 Key 回退及接口失败状态未实际复测。

## 未完成与边界

未逐页点击全部年报链接；未验证移动端与跨设备同步；未保存扶摇完整原始响应；未完成从主营毛利到归母利润的逐项归因；未录制演示视频。当前仅支持宁德时代 2024—2025 年案例。证据与结论由程序及年报摘录生成，大模型只用于澄清与四问。结论不是投资建议。
