# 今天抽一个就好

轻量随机任务提醒 PWA。它把“今天要做什么”的压力变成一个很小的抽签动作：先选择今天的状态，再抽一个刚好能启动的小任务，完成后给出即时反馈。

## 项目定位

这个项目不是传统待办清单，而是一个低压力启动器。它适合在精力波动、选择困难、拖延或任务过载时使用，目标是帮助用户少想一点、先动一下。

核心体验：

- 选择今天状态：不错、一般般、我很摆。
- 按状态抽任务：不同状态进入不同任务池。
- 一键救援：状态很低时抽极小行动。
- 完成反馈：记录当日完成，并触发礼花、震动和短音效。
- 本地管理任务池：添加、编辑、删除、批量导入。
- 每日轻提醒：在浏览器允许通知后，到点提醒用户抽一个任务。

## 当前功能

- 状态分层抽取：
  - `不错`：冲刺池，适合小冒险和轻挑战。
  - `一般般`：一般池，适合轻微新鲜感。
  - `我很摆`：低能量池，适合身体维护和最小行动。
- 周末增强：周末的一般池会合并冲刺池，让任务更有新鲜感。
- 一键救援：从超小救援任务中随机抽一个。
- 完成记录：每天只记录一次完成，数据保存在浏览器本地。
- 任务后台：支持单条添加、行内编辑、删除、多行粘贴导入。
- PWA 基础能力：`manifest.json`、独立窗口、移动端 viewport、Apple Web App 元数据。

## 文件结构

```text
.
├── README.md        # 项目介绍、启动方式、功能概览
├── PRD.md           # 产品目标、范围、需求、验收标准
├── TECH.md          # 技术架构、状态设计、实现方案
├── TODO.md          # 开发进度、风险、下一步
├── app/             # Next.js 页面、布局、全局样式
├── components/      # UI 组件目录，后续从 app/page.tsx 拆分
├── lib/             # 工具函数目录，后续承载状态、抽取、存储逻辑
├── public/          # PWA manifest、图标、页面图片
└── types/           # 第三方类型补充
```

## 本地开发

准备：

- Node.js 18 或更高版本
- npm

```bash
git clone https://github.com/pepperony98-cyber/Micro-Action.git
cd Micro-Action
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 验证

```bash
npm run lint
npm run build
```

注意：当前 `npm run lint` 实际执行的是 `tsc --noEmit`，用于 TypeScript 类型检查。

## 部署到 Vercel

这个项目是纯前端 Next.js 应用，不需要数据库，也不需要配置环境变量。

### 方式一：网页导入

1. Fork 或下载本仓库。
2. 登录 [Vercel](https://vercel.com)。
3. 点击 `New Project`。
4. 选择 GitHub 仓库 `Micro-Action`。
5. 保持默认配置：
   - Framework Preset: `Next.js`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: 不用填写
6. 点击 `Deploy`。

部署完成后，Vercel 会生成一个可访问的 App 链接。

### 方式二：让 Codex 协助部署

如果你把这个 GitHub 链接交给 Codex，让它帮你安装和部署，通常需要先准备：

- 一个 Vercel 账号
- 已登录 Vercel，或提供 Vercel CLI 可用的登录授权
- 已授权 Vercel 读取你的 GitHub 仓库

Codex 可以协助完成：

- 克隆仓库
- 安装依赖
- 本地构建检查
- 按 Vercel 流程部署

但 Codex 不能凭空登录你的 Vercel 账号。遇到登录、授权、验证码或 GitHub App 授权页面时，需要你自己确认。

## 访问统计

项目已经接入 Vercel Web Analytics。部署到 Vercel 后，在 Vercel 项目后台打开：

```text
Analytics → Enable
```

重新部署并访问站点后，就可以看到页面浏览量、访客、来源等匿名统计数据。

## 发布同步

每次改完代码后需要重新部署到 Vercel，手机上的 PWA 才会同步更新。部署完成后，如果手机仍显示旧版，退出并重新打开 App，必要时刷新浏览器页面。

## 当前限制

- 数据只保存在单设备 `localStorage`，没有账号、同步和备份。
- 浏览器通知依赖页面运行，不等同于系统级后台推送。
- 目前没有自动化单元测试，主要依赖 TypeScript 检查、构建和手动体验验证。
- 核心逻辑仍集中在 `app/page.tsx`，后续建议拆到 `components/` 和 `lib/`。
