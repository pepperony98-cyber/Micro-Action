# TECH：今天抽一个就好

## 1. 技术栈

- Next.js `^16.2.9`
- React `^19.2.7`
- TypeScript `^6.0.3`
- `canvas-confetti`：完成任务后的礼花动画
- 浏览器能力：`localStorage`、Notification API、Vibration API、Web Audio API

## 2. 应用结构

```text
app/
├── layout.tsx      # metadata、manifest、viewport、根布局
├── page.tsx        # 当前核心页面、状态、交互逻辑
└── globals.css     # 全局样式

components/
└── README.md       # UI 组件目录占位，后续拆分页面组件

lib/
└── README.md       # 工具函数目录占位，后续拆分业务逻辑

public/
├── gacha-machine.png
├── icon.svg
└── manifest.json
```

## 3. 当前实现概览

`app/page.tsx` 是客户端组件，通过 `"use client"` 启用浏览器状态和 API。

主要职责：

- 定义任务池类型、状态类型、应用状态类型。
- 初始化默认任务池和默认文案。
- 从 `localStorage` 读取历史状态。
- 规范化旧版本状态。
- 根据当前状态抽任务。
- 记录每日完成。
- 管理提醒开关与提醒时间。
- 渲染首页和配置页。

`app/globals.css` 承担全部页面视觉样式。

## 4. 状态设计

当前本地存储键：

- `daily-task-draw-state-v2`：当前状态。
- `daily-task-draw-state-v1`：旧状态兼容读取。

核心状态结构：

```ts
type AppState = {
  taskPools: TaskPools;
  tinyRescueTasks: string[];
  lastDrawnTask: DrawnTask | null;
  completionByDate: Record<string, Completion>;
  comebackByDate: Record<string, { firstClickedAt: string }>;
  reminderTime: string;
  reminderEnabled: boolean;
  lastReminderDate: string | null;
  lastComebackReminderDate: string | null;
  copy: AppCopy;
  uiConfig: LegacyUiConfig;
};
```

任务池：

- `good`：状态不错时使用。
- `okay`：状态一般时使用。
- `low`：状态低时使用。
- `rescue`：救援池字段。
- `micro`、`adventure`、`identity`：早期任务池兼容字段。

## 5. 抽取逻辑

普通抽取：

1. 根据当前 mood 找到对应 poolId。
2. 调用 `getDrawableTasks` 获取可抽任务。
3. 如果任务池为空，生成 `mode: "empty"` 的提示任务。
4. 如果任务池不为空，随机抽取一条。
5. 写入 `lastDrawnTask`。

特殊规则：

- 周末时，`okay` 会合并 `okay` 和 `good`。
- 一键救援使用 `tinyRescueTasks`，为空时回退到默认救援任务。

## 6. 完成逻辑

点击完成后：

1. 检查 `lastDrawnTask` 是否存在且不是空池提示。
2. 调用 `markComeback` 记录当天首次行动。
3. 写入 `completionByDate[today]`。
4. 触发 confetti、震动、短音效。
5. 显示短暂庆祝文案。
6. 清空 `lastDrawnTask`。

当天已有完成记录时，完成按钮不可再次记录。

## 7. 提醒逻辑

当前通过页面内 `setInterval` 每分钟检查：

- 用户开启提醒。
- 当前时间已超过 `reminderTime`。
- 当天尚未完成。
- 当天尚未发送过提醒。

满足条件时：

- 更新 `lastReminderDate`。
- 若 Notification 权限为 `granted`，发送浏览器通知。

限制：

- 页面未运行时无法保证准时提醒。
- 没有 service worker 后台推送。

## 8. PWA 配置

`app/layout.tsx`：

- 设置页面标题和描述。
- 引用 `/manifest.json`。
- 配置 Apple Web App 基础字段。
- 配置移动端 viewport 和 `themeColor`。

`public/manifest.json`：

- `display: "standalone"`
- `orientation: "portrait-primary"`
- 使用 SVG icon。

## 9. 建议拆分方向

当前 `app/page.tsx` 较集中，后续可按低风险顺序拆分：

1. `lib/date.ts`：`todayKey`、`isWeekend`、提醒时间判断。
2. `lib/tasks.ts`：任务清洗、随机抽取、任务池合并。
3. `lib/storage.ts`：状态读取、规范化、版本迁移。
4. `components/TaskResultCard.tsx`：任务结果卡片。
5. `components/MoodPicker.tsx`：状态选择。
6. `components/TaskPoolEditor.tsx`：任务池管理。
7. `components/ReminderCard.tsx`：提醒设置。

## 10. 验证命令

```bash
npm run lint
npm run build
```

当前 `lint` 是类型检查命令。如果需要真正 lint，建议新增 ESLint 配置，或将脚本改名为 `typecheck`。

## 11. 工程风险

- 没有测试覆盖，抽取、迁移和本地存储逻辑需要手测。
- 所有数据在 `localStorage`，用户清缓存会丢失。
- `lastDrawnTask` 在状态规范化时会重置，刷新后不保留最近抽取。
- 文案配置类型存在，但 UI 仍有较多硬编码文案。
- 完整离线能力不足，PWA 目前主要是安装壳和 manifest。
