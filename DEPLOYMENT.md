# 百炼北京地域 + 扶摇：服务端部署配置

现有源码仓库：https://github.com/gcc20200713-creator/insightx-investment-research

代码已支持阿里云百炼华北2（北京）千问。默认模型 `qwen-plus`，固定服务端端点 `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`。不能把其他地域的Key混用。用户已在 Vercel 生产环境亲自配置密钥；2026-10-15 扶摇与千问真实调用均成功，见 TESTING.md。

## Vercel 网页部署（无需插件）

1. 登录 Vercel，选择 Add New → Project。使用 GitHub 授权导入上述仓库。授权、登录、账户开通和可能的费用由用户本人处理。
2. Framework Preset 保持 Next.js，Root Directory 保持根目录，默认构建命令 `npm run build`。
3. 在 Environment Variables 添加下面的变量；值由用户亲自输入，密钥标记为 Sensitive。不要截图或发聊天。

| Name | Value | 类型 |
| --- | --- | --- |
| AI_PROVIDER | dashscope | 普通配置 |
| DASHSCOPE_API_KEY | 用户的百炼北京地域Key | 密钥 |
| DASHSCOPE_MODEL | qwen-plus | 普通配置 |
| FUYAO_API_KEY | 用户此前调用成功的扶摇Key | 密钥 |

4. 点击 Deploy，完成后打开分配的生产URL。如果在部署后才添加变量，需重新部署才能应用。
5. 让招聘方匿名访问生产页面；如平台开启访问保护，需按账户权限在项目设置中调整生产部署保护。不要提供仅账户可见的预览URL。

## 真实验收

- 输入宁德时代示例命题，查看确认页是否采用模型澄清。
- 六项执行记录应有百炼、模型、请求时间、HTTP状态及响应ID；`modelStatus=success` 才代表模型返回并通过校验。
- 扶摇只有本次接口成功才显示「本次接口调用」，无Key或失败必须显示「历史数据」。
- 大模型真实HTTP成功但结构校验失败时，应标记失败并降级，不能写成端到端通过。
- 密钥问题、额度不足、超时等均需记录实际结果。不要通过前端或API返回密钥、原始错误体。

生产站点：https://insightx-investment-research-yeht.vercel.app 。GitHub 仓库更新会触发自动构建；环境变量变更后应重新部署。

## 当前运行边界

模型只辅助澄清与四问，证据、财务计算和结论仍由程序及年报摘录生成。追问查询现有证据。完整Agent自主规划、任意标的与完整因果桥接尚未实现。

## 官方参考

- 百炼Key：https://help.aliyun.com/zh/model-studio/get-api-key/
- 百炼结构化输出：https://help.aliyun.com/zh/model-studio/qwen-structured-output
- Vercel环境变量：https://vercel.com/docs/environment-variables
