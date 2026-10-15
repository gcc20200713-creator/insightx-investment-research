# InsightX 验证记录

执行日期：2026-10-15。测试环境：Node.js 24、Next.js 15.5.12；无扶摇 API Key。

| 场景 | 操作 | 结果 |
| --- | --- | --- |
| 财务计算 | `npm test` | 归母、同比、千元与亿元换算通过 |
| 接口结构异常 | 单元测试传入 `code=2001`、缺少2024期 | 拒绝伪装成功数据 |
| 案例主链路 | `POST /api/research` 传宁德时代2025年命题 | 返回4个问题、6条证据；支持、反对、无法验证齐全 |
| 越界命题 | 单元测试传其他公司命题 | 证据为空，结论“证据不足” |
| 相反命题 | 传“主要来自一次性收益” | 不套用示例的有限支持结论 |
| 输入校验 | `POST /api/research` 传1字命题 | HTTP 400 |
| 无 Key | `GET /api/financials` | `mode=historical`、`apiAttempt=not_configured`，显示年报来源 |
| 首页 | 请求 `/` | HTTP 200 |
| 生产构建 | `npm run build` | TypeScript与Next.js构建通过 |

| 业务错误回退 | 模拟 `code=2001` 且服务端配置测试 Key | 明确回退 `historical`、`apiAttempt=failed` |

未验证：真实扶摇 Key 调用、云端部署、真实大模型澄清、跨浏览器任务同步。这些不能写作已完成。接口超时分支有实现，但尚未对真实超时服务做端到端复现。
