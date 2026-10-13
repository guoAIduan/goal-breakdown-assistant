# 拆解大师 · Goal Breakdown Assistant

把任何模糊的目标，拆成一份「每一步都知道该做什么」的可执行清单。

输入一句话目标，工具会给出 4-8 个有先后顺序的步骤；每个步骤都带子任务清单、推荐工具、耗时预估、难度、产出物和一条实用建议。子任务可以逐条勾选，整体进度实时可视化。

> 在线体验：`https://<你的用户名>.github.io/goal-breakdown-assistant/`（首次部署后替换成真实地址）

## 功能

- **一键拆解**：首页输入任意目标，或直接点示例卡片，几秒内拿到结构化步骤
- **两种拆解引擎**：默认用内置规则拆解（零配置、纯前端、离线可用）；也可以填入自己的模型接口，走真正的 AI 拆解，失败时自动降级到内置规则，不会卡在空白页
- **进度追踪**：勾选子任务，步骤进度条和整体完成度实时更新，全部完成有庆祝动效
- **模板广场**：内置 AI 创作、内容运营、学习成长、生活管理、职业发展、创业副业等分类模板，支持搜索、预览、一键套用
- **自定义工作流**：可视化编辑自己的步骤清单，保存为个人模板反复使用
- **导出与分享**：把拆解结果复制为 Markdown、下载 `.md` / `.json`，或直接打印成 PDF
- **本地优先**：所有数据只存在浏览器 `localStorage`，不上传任何服务器

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript + Vite 8 |
| 样式 | Tailwind CSS v4 + shadcn/ui（Radix UI） |
| 动画 | framer-motion |
| 图标 | lucide-react |
| 路由 | react-router-dom 7（路由级懒加载） |
| 部署 | GitHub Pages + GitHub Actions |

## 快速开始

需要 Node.js 20 或以上。

```bash
npm install      # 安装依赖
npm run dev      # 本地开发，默认 http://localhost:5173
npm run build    # 生产构建，产物在 dist/
npm run preview  # 本地预览构建产物
npm run check    # 类型检查 + ESLint
```

## 部署到 GitHub Pages

仓库已包含 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)，推到 `main` 分支即自动构建并发布：

1. 在仓库 **Settings → Pages** 里把 **Source** 设为 **GitHub Actions**
2. 推送到 `main`（或在 Actions 页面手动触发 `Deploy to GitHub Pages`）
3. 等 Actions 跑完，站点地址会显示在 workflow 的 deploy 步骤里

部署到其他静态托管（Vercel、Netlify、对象存储等）时，直接 `npm run build` 并上传 `dist/` 即可。

> **关于刷新 404**：这是一个单页应用，直接访问 `/my` 这类深层链接时，静态托管需要回退到 `index.html`。上面的 workflow 会自动复制一份 `dist/404.html` 来处理 GitHub Pages 的这种情况；换平台时请自行配置 SPA 回退规则。

### 部署在子路径时

站点不在根路径时（例如 `https://example.com/tools/`），用 `BASE_PATH` 指定前缀：

```bash
BASE_PATH=/tools/ npm run build
```

## AI 拆解配置

点击右上角 **设置** 可切换两种模式：

**内置规则拆解（默认）**

不需要任何 Key。会先用关键词匹配内置模板（例如「制作一部AI短剧」「三个月备考雅思」），匹配不到就用通用的五步法框架（明确验收标准 → 拆解路径 → 准备资源 → 分阶段执行 → 复盘交付）套用到你的目标上。纯前端计算，离线也能用。

**调用我的模型接口**

填入任意兼容 OpenAI `/chat/completions` 的服务即可，内置 DeepSeek、OpenAI、通义千问、智谱 GLM 预设：

| 配置项 | 说明 |
|---|---|
| Base URL | 接口根地址，通常以 `/v1` 结尾，例如 `https://api.deepseek.com/v1` |
| 模型名称 | 例如 `deepseek-chat`、`gpt-4o-mini`、`qwen-plus` |
| API Key | 只保存在你浏览器的 `localStorage`，请求直接由浏览器发往你填写的服务商 |

模型返回的步骤会先按 JSON 解析，解析失败再回退到 Markdown / 自然语言解析，尽量保证「模型自由发挥」时页面也不会空着。

## 项目结构

```
src/
├── app.tsx                    # 路由表（页面均为懒加载）
├── index.tsx                  # 入口：Router + 错误边界
├── components/
│   ├── Header.tsx             # 顶部导航 + 设置入口
│   ├── SettingsDialog.tsx     # 拆解方式与模型接口设置
│   ├── HeroIllustration.tsx   # 首页内联 SVG 插画
│   ├── StepCard.tsx           # 步骤卡片（子任务勾选）
│   ├── ProgressRing.tsx       # 完成度圆环
│   ├── Celebration.tsx        # 全部完成时的庆祝动效
│   └── ui/                    # shadcn/ui 基础组件
├── data/                      # 类型定义、内置模板、示例目标
├── hooks/                     # 数据 store、设置、移动端判断
├── lib/
│   ├── ai.ts                  # OpenAI 兼容接口的流式调用
│   ├── localBreakdown.ts      # 内置规则拆解（无需 Key）
│   ├── parseSteps.ts          # 模型输出解析 + 耗时/难度汇总
│   ├── exporters.ts           # Markdown / JSON 导出
│   ├── settings.ts            # 设置存储
│   └── storage.ts             # localStorage 封装
└── pages/                     # 首页 / 拆解结果 / 模板广场 / 我的拆解 / 工作流编辑器
```

## 数据说明

拆解记录、自定义模板、模型设置都存在浏览器本地：

| localStorage key | 内容 |
|---|---|
| `gba:breakdown_history` | 拆解记录与进度 |
| `gba:my_templates` | 自定义模板 |
| `gba:settings` | 拆解方式与模型接口配置 |

清空浏览器数据会一并删除这些内容；需要长期保存时请用「导出」功能下载 Markdown / JSON。

## 常见问题

**AI 模式报错怎么办？**
界面会提示具体原因（Key 无效、接口地址不对、额度不足等），并自动用内置规则给出一份可用清单。检查设置里的 Base URL 是否需要以 `/v1` 结尾、模型名称是否正确即可。

**能不能不填 Key 就用 AI？**
不能。浏览器里没有安全的办法替你保管第三方 Key，所以默认提供的是内置规则拆解。如果你希望所有人共享一个 Key，需要自己加一层后端代理，把 `src/lib/ai.ts` 里的请求地址改到你的代理即可。

**为什么进度只存在本地？**
这是一个纯静态应用，没有后端。好处是零成本、无需登录、数据不外传；代价是换设备需要重新导出导入。

## License

[MIT](LICENSE)
