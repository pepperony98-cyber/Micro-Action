# lib

工具函数和业务逻辑目录。

当前工具函数仍集中在 `app/page.tsx`。后续建议优先拆分：

- `date.ts`：日期 key、周末判断、提醒时间判断。
- `tasks.ts`：任务清洗、随机抽取、任务池选择。
- `storage.ts`：`localStorage` 读取、写入、状态迁移。
- `feedback.ts`：震动、音效、礼花等浏览器反馈封装。
