# 项目状态快照

更新时间：2026-06-21  
项目名：今天抽一个就好  
类型：轻量随机任务提醒 PWA

## 一句话概览

这是一个基于 Next.js 的单页 PWA，用“今天状态 -> 随机抽一个小任务 -> 完成反馈”的方式降低启动成本。当前代码可以通过类型检查和生产构建，主要功能已经落在本地浏览器端，适合继续做体验微调、PWA 完整度补强和发布同步。

## 当前结论

- 项目尚未初始化 git 仓库，开源前需要执行 `git init` 并创建远程仓库。
- 核心应用集中在 `app/page.tsx` 和 `app/globals.css`，属于小型但已经可用的前端项目。
- PWA manifest、移动端 viewport、Apple Web App 元数据已经配置。
- 已清理公开文案，项目适合以“随机任务提醒 PWA”或“轻量任务启动器”方向展示。
- `.gitignore` 已排除 `node_modules`、`.next`、`.vercel`、输出物和旧 HTML 原型。

## 技术栈

- Next.js `^16.2.9`
- React `^19.2.7`
- TypeScript `^6.0.3`
- `canvas-confetti` 用于完成任务后的庆祝动画
- 浏览器 `localStorage` 用于保存任务池、完成记录、提醒设置等状态

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 本地开发服务，默认打开 `http://localhost:3000` |
| `npm run build` | Next.js 生产构建 |
| `npm run start` | 启动生产构建后的服务 |
| `npm run lint` | 当前实际执行 `tsc --noEmit` 类型检查 |

## 已实现功能

- 三档状态抽取：
  - `不错` -> 冲刺池 `good`
  - `一般般` -> 一般池 `okay`
  - `我很摆` -> 低能量池 `low`
- 首页点击状态按钮后立即抽任务。
- 默认抽取使用当前选中的状态池。
- 周末时，一般池会合并一般池和冲刺池，提高任务新鲜度。
- 一键救援模式从超小任务池抽任务。
- 任务完成后：
  - 写入当日完成记录
  - 播放礼花动画
  - 震动反馈
  - 播放短音效
  - 显示庆祝文案
- 同一天完成后，完成按钮会禁用，避免重复记录。
- 任务池配置页支持：
  - 按状态池切换
  - 单条添加
  - 行内编辑
  - 删除
  - 多行粘贴批量导入
- 每日轻提醒支持：
  - 设置提醒时间
  - 开关提醒
  - 浏览器通知权限已授予时发送通知
- PWA 支持：
  - `public/manifest.json`
  - `display: standalone`
  - `portrait-primary`
  - SVG icon
  - iOS Apple Web App 基础元数据

## 数据与状态

本项目目前没有后端和数据库，全部核心状态保存在浏览器本地。

主要存储键：

- `daily-task-draw-state-v2`：当前版本状态
- `daily-task-draw-state-v1`：旧版本兼容读取

主要状态内容：

- 任务池 `taskPools`
- 救援任务 `tinyRescueTasks`
- 最近抽到的任务 `lastDrawnTask`
- 每日完成记录 `completionByDate`
- 回归/打开记录 `comebackByDate`
- 每日提醒时间与开关
- 旧版 UI 配置兼容字段 `uiConfig`

## 文件结构

```text
.
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── README.md
├── lib/
│   └── README.md
├── public/
│   ├── gacha-machine.png
│   ├── icon.svg
│   └── manifest.json
├── types/
│   └── canvas-confetti.d.ts
├── README.md
├── PRD.md
├── TECH.md
├── TODO.md
├── next.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```

## 建议下一步

1. 初始化 git 仓库并提交初始版本。
2. 补一轮真实浏览器手测，重点覆盖移动端视口、添加/编辑/删除任务、通知权限、PWA 安装体验。
3. 明确 PWA 目标：如果需要离线可用，增加 service worker 或采用 Next.js 适配方案。
4. 增加导出/导入 localStorage 数据能力，降低用户换设备或清缓存时的数据损失风险。
5. 将 `lint` 脚本改成更准确的名称，或引入真正的 lint 规则。
6. 如果准备继续发布，跑一次 Vercel 预览部署并在手机 PWA 上验证缓存更新。
