"use client";

import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";

type PoolId = "micro" | "adventure" | "identity" | "rescue" | "low" | "okay" | "good";
type MoodId = "good" | "okay" | "low";
type DrawMode = "normal" | "sos" | "empty";
type ActiveView = "home" | "config";
type TaskPools = Record<PoolId, string[]>;

type DrawnTask = {
  task: string;
  poolId: PoolId;
  mode: DrawMode;
  drawnAt: string;
};

type Completion = {
  task: string;
  poolId: PoolId;
  completedAt: string;
};

type AppCopy = {
  appName?: string;
  welcomeTitle?: string;
  lastComebackLabel?: string;
  lastComebackToday?: string;
  noPlanLine?: string;
  chooseStateLine?: string;
  statsTitle?: string;
  comebackLabel?: string;
  completeLabel?: string;
  trendMore?: string;
  trendLess?: string;
  trendSame?: string;
  normalDrawButton?: string;
  redrawButton?: string;
  completeButton?: string;
  rescueButton?: string;
  tinyRescueTitle?: string;
  tinyRescueBody?: string;
  celebrationMessage?: string;
  dopamineMessage?: string;
  emptyTaskTitle?: string;
  emptyTaskBody?: string;
  taskPrefix?: string;
  taskBody?: string;
  managerTitle?: string;
  notificationButton?: string;
  reminderLabel?: string;
};

type LegacyUiConfig = {
  theme?: {
    motion?: number;
  };
};

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

const STORAGE_KEY = "daily-task-draw-state-v2";
const LEGACY_STORAGE_KEY = "daily-task-draw-state-v1";

const SEED_POOLS: TaskPools = {
  micro: ["换壁纸", "晒太阳", "听新歌单", "去便利店买没吃过的东西"],
  adventure: ["新咖啡店", "新公园", "新书店", "看电影"],
  identity: ["游泳30分钟", "力量训练", "投2份简历", "英语 shadowing 10分钟"],
  rescue: ["洗头", "洗澡", "换床单", "收拾桌面10分钟", "出门晒太阳"],
  low: ["洗头", "喝一杯热水", "出门晒太阳"],
  okay: ["学一句西班牙语", "看云10分钟", "听一首陌生歌"],
  good: ["去陌生咖啡店", "学折纸", "去新公园"]
};

const DEFAULT_TINY_RESCUE_TASKS = ["喝一口水", "伸个懒腰", "看一眼窗外"];

const DEFAULT_COPY: AppCopy = {
  appName: "今天抽一个就好",
  redrawButton: "换一个",
  completeButton: "我完成了",
  celebrationMessage: "You Win!",
  dopamineMessage: "太棒了！多巴胺+10",
  notificationButton: "打开浏览器通知",
  reminderLabel: "每日轻提醒"
};

const DEFAULT_STATE: AppState = {
  taskPools: SEED_POOLS,
  tinyRescueTasks: DEFAULT_TINY_RESCUE_TASKS,
  lastDrawnTask: null,
  completionByDate: {},
  comebackByDate: {},
  reminderTime: "10:00",
  reminderEnabled: true,
  lastReminderDate: null,
  lastComebackReminderDate: null,
  copy: DEFAULT_COPY,
  uiConfig: { theme: { motion: 2 } }
};

const MOODS: Array<{
  id: MoodId;
  poolId: PoolId;
  homeLabel: string;
  tabLabel: string;
  hint: string;
  emoji: string;
  className: string;
}> = [
  {
    id: "good",
    poolId: "good",
    homeLabel: "不错",
    tabLabel: "冲刺池",
    hint: "脑子有余量时，抽一个小冒险。",
    emoji: "😎",
    className: "moodGood"
  },
  {
    id: "okay",
    poolId: "okay",
    homeLabel: "一般般",
    tabLabel: "一般池",
    hint: "状态普通时，抽一点轻微新鲜感。",
    emoji: "😐",
    className: "moodOkay"
  },
  {
    id: "low",
    poolId: "low",
    homeLabel: "我很摆",
    tabLabel: "我很摆池",
    hint: "什么都不想做时，只抽最基础的身体维护。",
    emoji: "🫠",
    className: "moodLow"
  }
];

const CONFIG_MOODS = MOODS;

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cleanTaskText(task: string) {
  return task.trim().replace(/\s+/g, " ");
}

function getRandomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function mergePool(poolId: PoolId, incoming?: string[]) {
  return incoming?.length ? incoming : SEED_POOLS[poolId];
}

function normalizeState(raw: string | null): AppState {
  if (!raw) return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      taskPools: {
        micro: mergePool("micro", parsed.taskPools?.micro),
        adventure: mergePool("adventure", parsed.taskPools?.adventure),
        identity: mergePool("identity", parsed.taskPools?.identity),
        rescue: mergePool("rescue", parsed.taskPools?.rescue),
        low: mergePool("low", parsed.taskPools?.low),
        okay: mergePool("okay", parsed.taskPools?.okay),
        good: mergePool("good", parsed.taskPools?.good)
      },
      tinyRescueTasks: parsed.tinyRescueTasks?.length ? parsed.tinyRescueTasks : DEFAULT_TINY_RESCUE_TASKS,
      lastDrawnTask: null,
      completionByDate: parsed.completionByDate ?? {},
      comebackByDate: parsed.comebackByDate ?? {},
      reminderTime: parsed.reminderTime ?? DEFAULT_STATE.reminderTime,
      reminderEnabled: parsed.reminderEnabled ?? true,
      lastReminderDate: parsed.lastReminderDate ?? null,
      lastComebackReminderDate: parsed.lastComebackReminderDate ?? null,
      copy: { ...DEFAULT_COPY, ...parsed.copy },
      uiConfig: { ...DEFAULT_STATE.uiConfig, ...parsed.uiConfig }
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  return normalizeState(window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY));
}

function hasReminderTimePassed(reminderTime: string) {
  const [hour, minute] = reminderTime.split(":").map(Number);
  const now = new Date();
  const reminderDate = new Date();
  reminderDate.setHours(hour, minute, 0, 0);
  return now >= reminderDate;
}

function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getDrawableTasks(taskPools: TaskPools, poolId: PoolId) {
  if (poolId !== "okay" || !isWeekend()) {
    return taskPools[poolId];
  }

  return Array.from(new Set([...taskPools.okay, ...taskPools.good]));
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function playWinTone() {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(990, context.currentTime + 0.14);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.24);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.25);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export default function Home() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [now, setNow] = useState(new Date());
  const [selectedMood, setSelectedMood] = useState<MoodId>("okay");
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [newTask, setNewTask] = useState("");
  const [editingTask, setEditingTask] = useState<{ poolId: PoolId; index: number } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [importText, setImportText] = useState("");
  const [celebration, setCelebration] = useState("");
  const [focusAddAfterScroll, setFocusAddAfterScroll] = useState(false);

  const addInputRef = useRef<HTMLInputElement | null>(null);
  const today = todayKey();
  const selectedMoodMeta = MOODS.find((mood) => mood.id === selectedMood) ?? MOODS[1];
  const activePool = selectedMoodMeta.poolId;
  const todayCompletion = state.completionByDate[today];
  const canComplete = Boolean(state.lastDrawnTask && state.lastDrawnTask.mode !== "empty" && !todayCompletion);

  useEffect(() => {
    setState(loadState());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isLoaded, state]);

  useEffect(() => {
    if (!isLoaded || !state.reminderEnabled || todayCompletion) return;

    const checkReminder = () => {
      const currentToday = todayKey();
      if (
        hasReminderTimePassed(state.reminderTime) &&
        !state.completionByDate[currentToday] &&
        state.lastReminderDate !== currentToday
      ) {
        updateState((current) => ({ ...current, lastReminderDate: currentToday }));
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("今天抽一个就好", { body: "今天不用硬撑，抽一个就好。" });
        }
      }
    };

    checkReminder();
    const reminderInterval = window.setInterval(checkReminder, 60 * 1000);
    return () => window.clearInterval(reminderInterval);
  }, [isLoaded, state.reminderEnabled, state.reminderTime, state.completionByDate, state.lastReminderDate, todayCompletion]);

  useEffect(() => {
    if (!focusAddAfterScroll) return;
    const timeout = window.setTimeout(() => {
      addInputRef.current?.focus();
      setFocusAddAfterScroll(false);
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [activeView, focusAddAfterScroll]);

  function updateState(updater: (current: AppState) => AppState) {
    setState((current) => updater(current));
  }

  function markComeback() {
    const key = todayKey();
    updateState((current) => {
      if (current.comebackByDate[key]) return current;
      return {
        ...current,
        comebackByDate: {
          ...current.comebackByDate,
          [key]: { firstClickedAt: new Date().toISOString() }
        }
      };
    });
  }

  function selectMood(moodId: MoodId) {
    setSelectedMood(moodId);
  }

  function selectMoodAndDraw(moodId: MoodId) {
    const mood = MOODS.find((item) => item.id === moodId) ?? MOODS[1];
    setSelectedMood(moodId);
    activateDraw(mood.poolId, "normal");
  }

  function drawGacha() {
    activateDraw(activePool, "normal");
  }

  function activateDraw(poolId: PoolId, mode: "normal" | "sos") {
    markComeback();
    if (mode === "sos") {
      const rescueTasks = state.tinyRescueTasks.length ? state.tinyRescueTasks : DEFAULT_TINY_RESCUE_TASKS;
      updateState((current) => ({
        ...current,
        lastDrawnTask: {
          task: getRandomItem(rescueTasks),
          poolId: "rescue",
          mode: "sos",
          drawnAt: new Date().toISOString()
        }
      }));
      vibrate(18);
      return;
    }

    const tasks = getDrawableTasks(state.taskPools, poolId);
    if (!tasks.length) {
      updateState((current) => ({
        ...current,
        lastDrawnTask: {
          task: "当前池子空空如也，先去下方后台加个任务吧！",
          poolId,
          mode: "empty",
          drawnAt: new Date().toISOString()
        }
      }));
      vibrate(18);
      return;
    }

    updateState((current) => ({
      ...current,
      lastDrawnTask: {
        task: getRandomItem(tasks),
        poolId,
        mode: "normal",
        drawnAt: new Date().toISOString()
      }
    }));
    vibrate(18);
  }

  function drawSos() {
    activateDraw("rescue", "sos");
  }

  function redrawTask() {
    if (!state.lastDrawnTask || state.lastDrawnTask.mode === "empty") {
      drawGacha();
      return;
    }

    if (state.lastDrawnTask.mode === "sos") {
      drawSos();
      return;
    }

    const poolId = state.lastDrawnTask.poolId;
    const tasks = getDrawableTasks(state.taskPools, poolId);
    if (!tasks.length) {
      goToConfig();
      return;
    }
    updateState((current) => ({
      ...current,
      lastDrawnTask: {
        task: getRandomItem(tasks),
        poolId,
        mode: "normal",
        drawnAt: new Date().toISOString()
      }
    }));
    vibrate(18);
  }

  function completeTask() {
    if (!state.lastDrawnTask || state.lastDrawnTask.mode === "empty") return;

    const completedTask = state.lastDrawnTask;
    markComeback();
    updateState((current) => ({
      ...current,
      completionByDate: {
        ...current.completionByDate,
        [today]: {
          task: completedTask.task,
          poolId: completedTask.poolId,
          completedAt: new Date().toISOString()
        }
      }
    }));

    const motion = state.uiConfig.theme?.motion ?? 2;
    confetti({ particleCount: 130 * motion, spread: 100, origin: { y: 0.64 } });
    confetti({ particleCount: 70 * motion, angle: 60, spread: 70, origin: { x: 0 } });
    confetti({ particleCount: 70 * motion, angle: 120, spread: 70, origin: { x: 1 } });
    vibrate([40, 30, 70]);
    playWinTone();
    setCelebration(`${state.copy.celebrationMessage ?? "You Win!"} ${state.copy.dopamineMessage ?? "太棒了！多巴胺+10"}`);
    updateState((current) => ({ ...current, lastDrawnTask: null }));
    window.setTimeout(() => setCelebration(""), 1900);
  }

  function goToConfig() {
    setActiveView("config");
    setFocusAddAfterScroll(true);
  }

  function goToHome() {
    setActiveView("home");
  }

  function addTask() {
    const task = cleanTaskText(newTask);
    if (!task) return;
    updateState((current) => {
      const existing = current.taskPools[activePool];
      if (existing.includes(task)) return current;
      return { ...current, taskPools: { ...current.taskPools, [activePool]: [...existing, task] } };
    });
    setNewTask("");
  }

  function importTasks() {
    const incomingTasks = importText.split("\n").map(cleanTaskText).filter(Boolean);
    if (!incomingTasks.length) return;

    updateState((current) => {
      const nextTasks = [...current.taskPools[activePool]];
      incomingTasks.forEach((task) => {
        if (!nextTasks.includes(task)) nextTasks.push(task);
      });
      return { ...current, taskPools: { ...current.taskPools, [activePool]: nextTasks } };
    });
    setImportText("");
  }

  function startEdit(poolId: PoolId, index: number) {
    setEditingTask({ poolId, index });
    setEditingValue(state.taskPools[poolId][index]);
  }

  function saveEdit() {
    if (!editingTask) return;
    const task = cleanTaskText(editingValue);
    if (!task) {
      setEditingTask(null);
      setEditingValue("");
      return;
    }

    updateState((current) => {
      const nextTasks = [...current.taskPools[editingTask.poolId]];
      if (nextTasks[editingTask.index] === task) return current;
      nextTasks[editingTask.index] = task;
      return { ...current, taskPools: { ...current.taskPools, [editingTask.poolId]: nextTasks } };
    });
    setEditingTask(null);
    setEditingValue("");
  }

  function deleteTask(poolId: PoolId, index: number) {
    updateState((current) => ({
      ...current,
      taskPools: {
        ...current.taskPools,
        [poolId]: current.taskPools[poolId].filter((_, taskIndex) => taskIndex !== index)
      }
    }));
  }

  function setReminderTime(reminderTime: string) {
    updateState((current) => ({ ...current, reminderTime }));
  }

  function setReminderEnabled(reminderEnabled: boolean) {
    updateState((current) => ({ ...current, reminderEnabled }));
  }

  return (
    <main className="pageShell">
      {celebration && <div className="celebrationBubble">{celebration}</div>}

      {activeView === "home" && (
        <section className="phoneStage" aria-label="扭蛋抽任务">
          <h1>✨ 今天不用硬撑，抽一个就好</h1>

          <div className="statePicker">
            <p>🤔 今天什么状态？</p>
            <div className="homeMoodButtons">
              {MOODS.map((mood) => (
                <button
                  className={`${mood.className} ${selectedMood === mood.id ? "active" : ""}`}
                  key={mood.id}
                  onClick={() => selectMoodAndDraw(mood.id)}
                  type="button"
                >
                  {mood.emoji} {mood.homeLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="drawStage">
            {state.lastDrawnTask ? (
              <TaskResultCard
                canComplete={canComplete}
                onComplete={completeTask}
                onGoToConfig={goToConfig}
                onRedraw={redrawTask}
                task={state.lastDrawnTask}
              />
            ) : (
              <section className="gachaCard">
                <img alt="随机多巴胺扭蛋机" className="gachaMachineImage" src="/gacha-machine.png" />
                <button className="gachaButton" onClick={drawGacha} type="button">
                  【 ⚡ 产生一个随机多巴胺 】
                </button>
              </section>
            )}
          </div>

          <button className="sosButton" onClick={drawSos} type="button">
            <span>🆘 一键救我(摆烂专区)</span>
          </button>
        </section>
      )}

      {activeView === "config" && (
        <section className="configSection">
          <section className="reminderCard">
            <div>
              <h2>⏰ 每日轻提醒</h2>
              <p>每天准时用多巴胺唤醒你</p>
            </div>
            <input
              aria-label="每日提醒时间"
              className="timeInput"
              onChange={(event) => setReminderTime(event.target.value)}
              type="time"
              value={state.reminderTime}
            />
            <button
              aria-label="开启每日轻提醒"
              aria-pressed={state.reminderEnabled}
              className={state.reminderEnabled ? "toggleSwitch on" : "toggleSwitch"}
              onClick={() => setReminderEnabled(!state.reminderEnabled)}
              type="button"
            >
              <span />
            </button>
          </section>

          <section className="poolConfigCard">
            <div className="configTabs">
              {CONFIG_MOODS.map((mood) => (
                <button
                  className={selectedMood === mood.id ? "active" : ""}
                  key={mood.id}
                  onClick={() => selectMood(mood.id)}
                  type="button"
                >
                  {mood.emoji} {mood.tabLabel} ({state.taskPools[mood.poolId].length})
                </button>
              ))}
            </div>

            <p className="poolQuote">“{selectedMoodMeta.hint}”</p>

            <div className="addTaskRow">
              <input
                onChange={(event) => setNewTask(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addTask();
                }}
                placeholder="加一个微小的多巴胺任务..."
                ref={addInputRef}
                value={newTask}
              />
              <button onClick={addTask} type="button">
                添加
              </button>
            </div>

            <div className="taskListScroller">
              <ul className="configTaskList">
                {state.taskPools[activePool].map((task, index) => (
                  <li key={`${task}-${index}`}>
                    {editingTask?.poolId === activePool && editingTask.index === index ? (
                      <>
                        <input
                          autoFocus
                          className="inlineTaskInput"
                          onBlur={saveEdit}
                          onChange={(event) => setEditingValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") saveEdit();
                            if (event.key === "Escape") {
                              setEditingTask(null);
                              setEditingValue("");
                            }
                          }}
                          value={editingValue}
                        />
                        <div className="taskIconActions">
                          <button
                            aria-label="保存任务"
                            onClick={saveEdit}
                            onMouseDown={(event) => event.preventDefault()}
                            type="button"
                          >
                            ✅
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span>{taskEmoji(index)} {task}</span>
                        <div className="taskIconActions">
                          <button aria-label="编辑任务" onClick={() => startEdit(activePool, index)} type="button">
                            ✏️
                          </button>
                          <button aria-label="删除任务" onClick={() => deleteTask(activePool, index)} type="button">
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="importPanel">
            <h2>📋 粘贴批量导入</h2>
            <textarea
              onChange={(event) => setImportText(event.target.value)}
              placeholder={"每行一个任务，例如：\n整理包包\n给猫剪指甲"}
              value={importText}
            />
            <button onClick={importTasks} type="button">
              导入到当前池子
            </button>
          </section>
        </section>
      )}

      <nav className="bottomFunctionBar" aria-label="页面功能区">
        <button className={activeView === "home" ? "active" : ""} onClick={goToHome} type="button">
          <span>🎲</span>
          <strong>随机多巴胺</strong>
        </button>
        <button className={activeView === "config" ? "active" : ""} onClick={() => setActiveView("config")} type="button">
          <span>🧰</span>
          <strong>任务池配置</strong>
        </button>
      </nav>
    </main>
  );
}

function TaskResultCard({
  canComplete,
  onComplete,
  onGoToConfig,
  onRedraw,
  task
}: {
  canComplete: boolean;
  onComplete: () => void;
  onGoToConfig: () => void;
  onRedraw: () => void;
  task: DrawnTask | null;
}) {
  if (!task) {
    return null;
  }

  if (task.mode === "empty") {
    return (
      <section className="resultCard empty">
        <h2>💡 {task.task}</h2>
        <button onClick={onGoToConfig} type="button">
          去添加
        </button>
      </section>
    );
  }

  const isSos = task.mode === "sos";

  return (
    <section className={isSos ? "resultCard sosResult" : "resultCard"}>
      <p className="resultEyebrow">{isSos ? "🚨 紧急救援" : "🎉 今日挑战"}</p>
      <h2 className="resultTask">{task.task}</h2>
      <p className="resultHint">只做这一件，完成就算赢。</p>
      <div className="resultActions">
        <button onClick={onRedraw} type="button">
          ♻️ 换一个
        </button>
        <button disabled={!canComplete} onClick={onComplete} type="button">
          ✅ 我完成了
        </button>
      </div>
    </section>
  );
}

function taskEmoji(index: number) {
  return ["🧼", "☀️", "💧", "🎧", "📘", "🌿"][index % 6];
}
