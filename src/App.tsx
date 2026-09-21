import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  CloudSun,
  Heart,
  ImagePlus,
  LayoutGrid,
  NotebookPen,
  Palette,
  Pencil,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  BackgroundImage,
  deleteBackground,
  getBackgrounds,
  load,
  save,
  saveBackground,
} from "./storage";
import {
  Attachment,
  Priority,
  Task,
  addHoursLocal,
  migrateTask,
  migrateTasks,
  taskDate,
  taskMinutes,
} from "./task-model";
import { TitleEditor } from "./title-editor";

type Diary = { id: string; date: string; mood: string; text: string };
type Appearance = {
  theme: string;
  uiTheme: string;
  mode: "preset" | "image";
  image?: string;
  brightness: number;
  imageBlur: number;
  glass: boolean;
  blur: number;
  opacity: number;
  color: string;
  textColor: string;
  border: boolean;
  borderOpacity: number;
  shadow: boolean;
  shadowStrength: number;
  auto: boolean;
  fontScale: number;
  titleScale: number;
  decorations: boolean;
  contentGlass: boolean;
  contentBlur: number;
  contentOpacity: number;
  contentColor: string;
  contentBorderOpacity: number;
  contentHighlight: number;
  contentShadow: number;
  contentRadius: number;
  syncGlass: boolean;
  workbenchOpacity: number;
  workbenchBlur: number;
  workbenchColor: string;
  workbenchBorder: boolean;
  workbenchBorderColor: string;
  workbenchBorderOpacity: number;
  workbenchShadow: boolean;
  workbenchShadowStrength: number;
  workbenchRadius: number;
  modalOpacity: number;
  modalBlur: number;
  modalBackdropBlur: number;
};
const today = new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID();
const starterBackgroundId = "starter-rainy-window";
const starterBackgroundUrl = `${import.meta.env.BASE_URL}backgrounds/rainy-window.png`;
const presets = [
  ["white", "纯净白"],
  ["grey", "雾灰"],
  ["pink", "淡樱粉"],
  ["blue", "云朵蓝"],
  ["mint", "薄荷绿"],
  ["lilac", "浅丁香"],
  ["butter", "奶油黄"],
  ["dot-grey", "灰色波点"],
  ["dot-pink", "粉色波点"],
  ["dot-blue", "蓝色波点"],
  ["grid-grey", "灰色格纹"],
  ["grid-pink", "粉色格纹"],
  ["grid-blue", "蓝色格纹"],
  ["star-grey", "灰色星星"],
  ["star-blue", "蓝色星星"],
  ["star-pink", "粉色星星"],
  ["cherry-blossom", "樱花小点"],
  ["blue-daydream", "蓝色星梦"],
  ["mint-clover", "薄荷四叶草"],
  ["lavender-wishes", "紫色心愿"],
  ["vanilla-cream", "香草格纹"],
  ["silver-star", "银色星屿"],
  ["pink-ribbon", "粉色蝴蝶结"],
  ["little-music", "小小音符"],
  ["cloudy-morning", "云朵清晨"],
  ["soft-notebook", "柔软笔记本"],
] as const;
const defaultAppearance: Appearance = {
  theme: "blue-daydream",
  uiTheme: "sky",
  mode: "image",
  image: starterBackgroundId,
  brightness: 100,
  imageBlur: 0,
  glass: true,
  blur: 22,
  opacity: 72,
  color: "#f7fbff",
  textColor: "#435b79",
  border: true,
  borderOpacity: 55,
  shadow: true,
  shadowStrength: 22,
  auto: true,
  fontScale: 100,
  titleScale: 100,
  decorations: false,
  contentGlass: true,
  contentBlur: 18,
  contentOpacity: 78,
  contentColor: "#fbfdff",
  contentBorderOpacity: 56,
  contentHighlight: 52,
  contentShadow: 18,
  contentRadius: 24,
  syncGlass: false,
  workbenchOpacity: 76,
  workbenchBlur: 26,
  workbenchColor: "#f7fbff",
  workbenchBorder: true,
  workbenchBorderColor: "#ffffff",
  workbenchBorderOpacity: 64,
  workbenchShadow: true,
  workbenchShadowStrength: 26,
  workbenchRadius: 30,
  modalOpacity: 78,
  modalBlur: 20,
  modalBackdropBlur: 5,
};
const uiThemes = [
  ["sakura", "樱花粉"],
  ["sky", "天空蓝"],
  ["mint", "薄荷绿"],
  ["lavender", "薰衣草紫"],
  ["butter", "奶油黄"],
  ["mist", "柔雾灰"],
  ["clear", "清透白"],
] as const;
type PlannerMode = "day" | "week" | "month" | "year";
type PageTitle = { eyebrow: string; title: string; note: string };
type PageTitles = Record<PlannerMode, PageTitle>;
const defaultTitles: PageTitles = {
  day: {
    eyebrow: "TODAY, SLOWLY",
    title: "Little Steps, Lovely Day",
    note: "给生活留一点空白，按自己的节奏前进。",
  },
  week: {
    eyebrow: "YOUR GENTLE WEEK",
    title: "Plan Your Gentle Week",
    note: "给生活留一点空白，按自己的节奏前进。",
  },
  month: {
    eyebrow: "MONTHLY RHYTHM",
    title: "A Month in Little Steps",
    note: "给生活留一点空白，按自己的节奏前进。",
  },
  year: {
    eyebrow: "YEAR OVERVIEW",
    title: "Slow Days, Soft Plans",
    note: "给生活留一点空白，按自己的节奏前进。",
  },
};
const initialTasks: Task[] = [
  {
    id: "1",
    title: "温柔地规划这一周",
    category: "个人计划",
    priority: "important",
    due: today,
    createdAt: today,
    done: false,
  },
  {
    id: "2",
    title: "回复项目笔记",
    category: "工作",
    priority: "urgent",
    due: today,
    createdAt: today,
    done: false,
  },
  {
    id: "3",
    title: "下午散一小会儿步",
    category: "生活",
    priority: "normal",
    due: today,
    createdAt: today,
    done: true,
  },
];
function App() {
  const [tasks, setTasks] = useState(() =>
    migrateTasks(load<Task[]>("mlw-tasks", initialTasks)).map((t) => ({
      ...t,
      createdAt: t.createdAt || today,
    })),
  );
  const [diaries, setDiaries] = useState(() =>
    load<Diary[]>("mlw-diaries", []),
  );
  const [categories, setCategories] = useState(() =>
    load<string[]>("mlw-cats", ["工作", "生活", "个人计划"]),
  );
  const [appearance, setAppearance] = useState(() => ({
    ...defaultAppearance,
    ...load<Partial<Appearance>>("mlw-appearance", {}),
  }));
  const [titles, setTitles] = useState<PageTitles>(() => ({
    ...defaultTitles,
    ...load<Partial<PageTitles>>("mlw-page-titles", {}),
  }));
  const [titleEditor, setTitleEditor] = useState(false);
  const [draftTitle, setDraftTitle] = useState<PageTitle>(defaultTitles.week);
  const [view, setView] = useState<"today" | "calendar" | "diary">("today");
  const [plannerMode, setPlannerMode] = useState<
    "day" | "week" | "month" | "year"
  >("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState("全部");
  const [panel, setPanel] = useState<"appearance" | "background" | "decor">(
    "appearance",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDue, setNewDue] = useState(`${today}T23:59`);
  const [newCategory, setNewCategory] = useState("个人计划");
  const [newPriority, setNewPriority] = useState<Priority>("normal");
  const [newNote, setNewNote] = useState("");
  const [newImage, setNewImage] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [diaryText, setDiaryText] = useState("");
  const [mood, setMood] = useState("☁️");
  const drag = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => save("mlw-tasks", tasks), [tasks]);
  useEffect(() => save("mlw-diaries", diaries), [diaries]);
  useEffect(() => save("mlw-cats", categories), [categories]);
  useEffect(() => save("mlw-appearance", appearance), [appearance]);
  useEffect(() => save("mlw-page-titles", titles), [titles]);
  useEffect(() => {
    getBackgrounds().then(setBackgrounds);
  }, []);
  const dateOnly = (date: string) => date.slice(0, 10);
  const visible = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (filter === "全部" || t.category === filter) &&
          (view === "today" ? dateOnly(t.due) === today : true),
      ),
    [tasks, filter, view],
  );
  const completed = tasks.filter(
    (t) => dateOnly(t.due) === today && t.done,
  ).length;
  const todayTotal = tasks.filter((t) => dateOnly(t.due) === today).length;
  const setA = (patch: Partial<Appearance>) =>
    setAppearance((a) => ({ ...a, ...patch }));
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((t) => [
      migrateTask({
        id: uid(),
        title: newTask.trim(),
        category: newCategory,
        priority: newPriority,
        due: newDue,
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
        note: newNote.trim(),
        image: newImage,
        done: false,
      }),
      ...t,
    ]);
    setNewTask("");
    setNewNote("");
    setNewImage("");
  };
  const openNewTask = (date: string, time = "09:00") => {
    const start = `${date}T${time}`;
    const end = addHoursLocal(start, 2);
    setEditingTask({
      id: uid(),
      title: "",
      category: "个人计划",
      priority: "normal",
      due: start,
      startAt: start,
      endAt: end,
      allDay: false,
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      attachments: [],
      done: false,
    });
  };
  const saveEditedTask = (task: Task) => {
    const normalized = migrateTask(task);
    setTasks((list) =>
      list.some((x) => x.id === task.id)
        ? list.map((x) => (x.id === task.id ? normalized : x))
        : [normalized, ...list],
    );
    setEditingTask(null);
  };
  const uploadTaskImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewImage(String(reader.result));
    reader.readAsDataURL(file);
  };
  const addCategory = () => {
    const name = prompt("输入新分类名称");
    if (name?.trim() && !categories.includes(name.trim()))
      setCategories((c) => [...c, name.trim()]);
  };
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await new Promise<string>((r) => {
      const x = new FileReader();
      x.onload = () => r(String(x.result));
      x.readAsDataURL(file);
    });
    const item = { id: uid(), name: file.name, url };
    await saveBackground(item);
    setBackgrounds((b) => [...b, item]);
    setA({ mode: "image", image: item.id });
  };
  const chooseImage = (id: string) => {
    setA({ mode: "image", image: id });
    if (appearance.auto) setA({ opacity: 82, blur: 28 });
  };
  const addDiary = () => {
    if (!diaryText.trim()) return;
    const found = diaries.find((d) => d.date === selectedDate);
    if (found)
      setDiaries((d) =>
        d.map((x) => (x.id === found.id ? { ...x, text: diaryText, mood } : x)),
      );
    else
      setDiaries((d) => [
        { id: uid(), date: selectedDate, text: diaryText, mood },
        ...d,
      ]);
    setDiaryText("");
  };
  const bgUrl =
    appearance.image === starterBackgroundId
      ? starterBackgroundUrl
      : backgrounds.find((b) => b.id === appearance.image)?.url;
  const contentValues = appearance.syncGlass
    ? {
        blur: appearance.blur,
        opacity: appearance.opacity,
        color: appearance.color,
        border: appearance.borderOpacity,
        highlight: appearance.borderOpacity,
        shadow: appearance.shadowStrength,
        radius: 30,
      }
    : {
        blur: appearance.contentBlur,
        opacity: appearance.contentOpacity,
        color: appearance.contentColor,
        border: appearance.contentBorderOpacity,
        highlight: appearance.contentHighlight,
        shadow: appearance.contentShadow,
        radius: appearance.contentRadius,
      };
  const vars = {
    "--glass": appearance.glass ? "1" : "0",
    "--glass-blur": `${appearance.blur}px`,
    "--glass-alpha": `${appearance.opacity / 100}`,
    "--glass-color": appearance.color,
    "--glass-border": appearance.border
      ? `${appearance.borderOpacity / 100}`
      : "0",
    "--glass-shadow": appearance.shadow
      ? `${appearance.shadowStrength}px`
      : "0",
    "--content-glass": appearance.contentGlass ? "1" : "0",
    "--content-blur": `${contentValues.blur}px`,
    "--content-alpha": `${contentValues.opacity / 100}`,
    "--content-color": contentValues.color,
    "--content-border": `${contentValues.border / 100}`,
    "--content-highlight": `${contentValues.highlight / 100}`,
    "--content-shadow": `${contentValues.shadow}px`,
    "--content-radius": `${contentValues.radius}px`,
    "--workbench-alpha": `${appearance.workbenchOpacity / 100}`,
    "--workbench-blur": `${appearance.workbenchBlur}px`,
    "--workbench-color": appearance.workbenchColor,
    "--workbench-border-color": appearance.workbenchBorderColor,
    "--workbench-border-alpha": appearance.workbenchBorder
      ? `${appearance.workbenchBorderOpacity / 100}`
      : "0",
    "--workbench-shadow": `${appearance.workbenchShadowStrength}px`,
    "--workbench-shadow-alpha": appearance.workbenchShadow ? "0.12" : "0",
    "--workbench-radius": `${appearance.workbenchRadius}px`,
    "--type-scale": `${appearance.fontScale / 100}`,
    "--title-scale": `${appearance.titleScale / 100}`,
    "--bg-brightness": `${appearance.brightness / 100}`,
    "--bg-blur": `${appearance.imageBlur}px`,
  } as React.CSSProperties;
  return (
    <main
      className={`app theme-${appearance.theme} ui-${appearance.uiTheme}`}
      style={
        { ...vars, "--user-text": appearance.textColor } as React.CSSProperties
      }
    >
      <div
        className="background-photo"
        style={
          appearance.mode === "image" && bgUrl
            ? { backgroundImage: `url(${bgUrl})` }
            : undefined
        }
      />
      <div className="pattern-layer" />
      <aside className="sidebar glass">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <span>my little world</span>
        </div>
        <nav>
          <button
            className={view === "today" ? "active" : ""}
            onClick={() => setView("today")}
          >
            <LayoutGrid /> 今日待办
          </button>
          <button
            className={view === "calendar" ? "active" : ""}
            onClick={() => setView("calendar")}
          >
            <CalendarDays /> 日历
          </button>
          <button
            className={view === "diary" ? "active" : ""}
            onClick={() => setView("diary")}
          >
            <NotebookPen /> 日记
          </button>
        </nav>
        <div className="side-section">
          <div className="small-title">
            任务分类{" "}
            <button onClick={addCategory}>
              <CirclePlus />
            </button>
          </div>
          <button
            className={filter === "全部" ? "cat active" : "cat"}
            onClick={() => setFilter("全部")}
          >
            <i className="dot all" />
            全部任务 <span>{tasks.length}</span>
          </button>
          {categories.map((c, i) => (
            <button
              key={c}
              className={filter === c ? "cat active" : "cat"}
              onClick={() => setFilter(c)}
            >
              <i className={`dot c${i}`} />
              {c}
              <span>{tasks.filter((t) => t.category === c).length}</span>
            </button>
          ))}
        </div>
        <button
          className="appearance-btn"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings2 /> 个性化设置 <Sparkles />
        </button>
      </aside>
      <section className="content">
        <section className="workbench glass">
          <header className="planner-toolbar">
            <div className="planner-brand">
              <span className="brand-mark">✦</span>
              <b>My Little World</b>
            </div>
            <div className="planner-modes">
              {(["day", "week", "month", "year"] as const).map((mode) => (
                <button
                  key={mode}
                  className={plannerMode === mode ? "selected" : ""}
                  onClick={() => {
                    setPlannerMode(mode);
                    setView(mode === "month" ? "calendar" : "today");
                  }}
                >
                  {{ day: "日", week: "周", month: "月", year: "年" }[mode]}
                </button>
              ))}
            </div>
            <div className="planner-tools">
              <button onClick={() => setView("calendar")} aria-label="日历">
                <CalendarDays />
              </button>
              <button onClick={() => setView("diary")} aria-label="日记">
                <NotebookPen />
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                aria-label="外观设置"
              >
                <Palette />
              </button>
            </div>
          </header>
          <header className="topbar">
            <div className="editable-title">
              <p className="eyebrow">{titles[plannerMode].eyebrow}</p>
              <h1>{titles[plannerMode].title}</h1>
              <p className="title-note">{titles[plannerMode].note}</p>
              <button
                className="title-edit"
                aria-label="编辑页面标题"
                onClick={() => {
                  setDraftTitle(titles[plannerMode]);
                  setTitleEditor(true);
                }}
              >
                <Pencil />
              </button>
            </div>
            <div className="date-controls">
              <button onClick={() => setWeekOffset((x) => x - 1)}>
                <ChevronLeft />
              </button>
              <button className="today-button" onClick={() => setWeekOffset(0)}>
                今天
              </button>
              <button onClick={() => setWeekOffset((x) => x + 1)}>
                <ChevronRight />
              </button>
              <span>
                {todayTotal ? Math.round((completed / todayTotal) * 100) : 0}%
                完成
              </span>
            </div>
          </header>
          {view === "today" && (
            <>
              {plannerMode === "year" ? (
                <YearOverview
                  tasks={tasks}
                  openMonth={(date) => {
                    setSelectedDate(date);
                    setPlannerMode("month");
                    setView("calendar");
                  }}
                />
              ) : plannerMode === "week" ? (
                <WeekPlanner
                  tasks={tasks}
                  weekOffset={weekOffset}
                  onCreate={openNewTask}
                  onOpen={(task) => setEditingTask(migrateTask(task))}
                />
              ) : (
                <>
                  <div className="stats">
                    <div className="glass stat">
                      <span className="stat-number">{todayTotal}</span>
                      <span>今日任务</span>
                    </div>
                    <div className="glass stat">
                      <span className="stat-number">{completed}</span>
                      <span>已经完成</span>
                    </div>
                    <div className="glass progress-stat">
                      <div>
                        <span>今日进度</span>
                        <b>
                          {todayTotal
                            ? Math.round((completed / todayTotal) * 100)
                            : 0}
                          %
                        </b>
                      </div>
                      <div className="progress">
                        <i
                          style={{
                            width: `${todayTotal ? (completed / todayTotal) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <section className="task-card content-glass">
                    <div className="section-head">
                      <div>
                        <p className="eyebrow">今日清单</p>
                        <h2>专注做好眼前的一件事。</h2>
                      </div>
                      <span className="count">
                        还剩 {visible.filter((t) => !t.done).length} 项
                      </span>
                    </div>
                    <TaskComposer
                      {...{
                        newTask,
                        setNewTask,
                        addTask,
                        newCategory,
                        setNewCategory,
                        categories,
                        newPriority,
                        setNewPriority,
                        newDue,
                        setNewDue,
                        newNote,
                        setNewNote,
                        newImage,
                        uploadTaskImage,
                      }}
                    />
                    <TaskList
                      tasks={visible}
                      toggle={(id) =>
                        setTasks((x) =>
                          x.map((y) =>
                            y.id === id ? { ...y, done: !y.done } : y,
                          ),
                        )
                      }
                      remove={(id) =>
                        setTasks((x) => x.filter((y) => y.id !== id))
                      }
                      open={(task) => setEditingTask(migrateTask(task))}
                    />
                  </section>
                </>
              )}
            </>
          )}
          {view === "calendar" && (
            <Calendar
              tasks={tasks}
              selected={selectedDate}
              setSelected={setSelectedDate}
              toggle={(id) =>
                setTasks((x) =>
                  x.map((y) => (y.id === id ? { ...y, done: !y.done } : y)),
                )
              }
              open={(task) => setEditingTask(migrateTask(task))}
            />
          )}
          {view === "diary" && (
            <section className="diary-layout">
              <div className="glass diary-editor">
                <p className="eyebrow">{selectedDate}</p>
                <h2>How did today feel?</h2>
                <div className="moods">
                  {["☁️", "🌷", "☀️", "✨", "🌙"].map((x) => (
                    <button
                      className={mood === x ? "selected" : ""}
                      key={x}
                      onClick={() => setMood(x)}
                    >
                      {x}
                    </button>
                  ))}
                </div>
                <textarea
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder="A small note for future me…"
                />
                <button className="primary" onClick={addDiary}>
                  Save entry
                </button>
              </div>
              <div className="glass diary-history">
                <p className="eyebrow">PAST PAGES</p>
                {diaries.length ? (
                  diaries.map((d) => (
                    <article key={d.id}>
                      <span>{d.mood}</span>
                      <div>
                        <b>{d.date}</b>
                        <p>{d.text}</p>
                      </div>
                      <button
                        onClick={() =>
                          setDiaries((x) => x.filter((y) => y.id !== d.id))
                        }
                      >
                        <Trash2 />
                      </button>
                    </article>
                  ))
                ) : (
                  <p className="empty">Your saved thoughts will rest here.</p>
                )}
              </div>
            </section>
          )}
        </section>
        {appearance.decorations && (
          <div
            className="decorations"
            onPointerMove={(e) => {
              if (drag.current) {
                (e.currentTarget.firstChild as HTMLElement).style.transform =
                  `translate(${e.clientX - drag.current.x}px,${e.clientY - drag.current.y}px)`;
              }
            }}
            onPointerUp={() => (drag.current = null)}
          >
            <span
              onPointerDown={(e) =>
                (drag.current = { x: e.clientX, y: e.clientY })
              }
            >
              ✦
            </span>
          </div>
        )}
        {settingsOpen && (
          <div className="settings-wrap">
            <div
              className="settings-scrim"
              onClick={() => setSettingsOpen(false)}
            />
            <aside className="settings glass">
              <header>
                <div>
                  <p className="eyebrow">打造你的空间</p>
                  <h2>外观设置</h2>
                </div>
                <button onClick={() => setSettingsOpen(false)}>
                  <X />
                </button>
              </header>
              <div className="setting-tabs">
                <button
                  className={panel === "appearance" ? "selected" : ""}
                  onClick={() => setPanel("appearance")}
                >
                  主题与玻璃
                </button>
                <button
                  className={panel === "background" ? "selected" : ""}
                  onClick={() => setPanel("background")}
                >
                  背景
                </button>
                <button
                  className={panel === "decor" ? "selected" : ""}
                  onClick={() => setPanel("decor")}
                >
                  装饰
                </button>
              </div>
              {panel === "appearance" && (
                <Appearance
                  a={appearance}
                  setA={setA}
                  reset={() => setAppearance(defaultAppearance)}
                />
              )}{" "}
              {panel === "background" && (
                <Background
                  a={appearance}
                  setA={setA}
                  backgrounds={backgrounds}
                  upload={upload}
                  choose={chooseImage}
                  remove={async (id) => {
                    await deleteBackground(id);
                    setBackgrounds((x) => x.filter((y) => y.id !== id));
                    if (appearance.image === id)
                      setA({ mode: "preset", image: undefined });
                  }}
                />
              )}
              {panel === "decor" && <Decor a={appearance} setA={setA} />}
            </aside>
          </div>
        )}
      </section>
      {editingTask && (
        <TaskEditor
          task={editingTask}
          appearance={appearance}
          categories={categories}
          onChange={setEditingTask}
          onClose={() => setEditingTask(null)}
          onSave={saveEditedTask}
          onDelete={(id) => {
            setTasks((list) => list.filter((t) => t.id !== id));
            setEditingTask(null);
          }}
        />
      )}
      {titleEditor && (
        <TitleEditor
          mode={plannerMode}
          value={draftTitle}
          onChange={setDraftTitle}
          onClose={() => setTitleEditor(false)}
          onSave={() => {
            setTitles((current) => ({ ...current, [plannerMode]: draftTitle }));
            setTitleEditor(false);
          }}
          onReset={() => setDraftTitle(defaultTitles[plannerMode])}
        />
      )}
    </main>
  );
}
const Range = ({
  label,
  value,
  min,
  max,
  onChange,
  unit = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (n: number) => void;
}) => (
  <label className="range">
    <span>
      {label}
      <b>
        {value}
        {unit}
      </b>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(+e.target.value)}
    />
  </label>
);
type ComposerProps = {
  newTask: string;
  setNewTask: (x: string) => void;
  addTask: () => void;
  newCategory: string;
  setNewCategory: (x: string) => void;
  categories: string[];
  newPriority: Priority;
  setNewPriority: (x: Priority) => void;
  newDue: string;
  setNewDue: (x: string) => void;
  newNote: string;
  setNewNote: (x: string) => void;
  newImage: string;
  uploadTaskImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
type SelectOption = { value: string; label: string };
function GlassSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value)?.label || value;
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", keys);
    };
  }, []);
  const move = (dir: number) => {
    const index = Math.max(
      0,
      options.findIndex((o) => o.value === value),
    );
    onChange(options[(index + dir + options.length) % options.length].value);
  };
  return (
    <div className="glass-select" ref={root}>
      <button
        type="button"
        className="glass-select-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((x) => !x)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            move(1);
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            move(-1);
          }
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <span>{selected}</span>
        <ChevronDown />
      </button>
      {open && (
        <div
          className="glass-select-menu"
          role="listbox"
          aria-label={`${label}选项`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={option.value === value ? "selected" : ""}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
              <span>{option.value === value && <Check />}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function TaskComposer(p: ComposerProps) {
  const categories = p.categories.map((c) => ({ value: c, label: c }));
  const priorities: [Priority, string][] = [
    ["normal", "普通"],
    ["important", "重要"],
    ["urgent", "紧急"],
  ];
  return (
    <>
      <div className="quick-add">
        <input
          value={p.newTask}
          onChange={(e) => p.setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && p.addTask()}
          placeholder="写下一个待办…"
        />
        <button onClick={p.addTask}>创建任务</button>
      </div>
      <div className="task-options">
        <GlassSelect
          label="任务分类"
          value={p.newCategory}
          options={categories}
          onChange={p.setNewCategory}
        />
        <GlassSelect
          label="任务优先级"
          value={p.newPriority}
          options={priorities.map(([value, label]) => ({ value, label }))}
          onChange={(value) => p.setNewPriority(value as Priority)}
        />
        <label>
          截止{" "}
          <input
            type="datetime-local"
            value={p.newDue}
            onChange={(e) => p.setNewDue(e.target.value)}
          />
        </label>
      </div>
      <div className="task-note">
        <textarea
          value={p.newNote}
          onChange={(e) => p.setNewNote(e.target.value)}
          placeholder="添加备注（可选）"
        />
        <label className="task-upload">
          <ImagePlus /> {p.newImage ? "已添加图片" : "添加图片"}
          <input type="file" accept="image/*" onChange={p.uploadTaskImage} />
        </label>
        {p.newImage && <img src={p.newImage} alt="待办附件预览" />}
      </div>
    </>
  );
}
function TaskList({
  tasks,
  toggle,
  remove,
  open,
}: {
  tasks: Task[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  open: (task: Task) => void;
}) {
  return (
    <div className="task-list">
      {tasks.map((t) => (
        <article
          className={`task ${t.done ? "done" : ""}`}
          key={t.id}
          onClick={() => open(t)}
        >
          <button
            className="check"
            onClick={(e) => {
              e.stopPropagation();
              toggle(t.id);
            }}
          >
            {t.done && <Check />}
          </button>
          <div className="task-title">
            {t.title}
            <small>
              创建于 {t.createdAt} · 截止 {t.due || "未设置"}
            </small>
            {t.note && <p>{t.note}</p>}
            {t.image && <img src={t.image} alt="任务附件" />}
          </div>
          <div className="task-actions">
            <span className={`priority ${t.priority}`}>
              {t.priority === "normal"
                ? "普通"
                : t.priority === "important"
                  ? "重要"
                  : "紧急"}
            </span>
            <span className="task-category">{t.category}</span>
            <button
              className="icon-button"
              onClick={(e) => {
                e.stopPropagation();
                remove(t.id);
              }}
              aria-label="删除任务"
            >
              <Trash2 />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
const imageAttachment = (file: File) =>
  new Promise<Attachment>((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("仅支持图片"));
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: uid(),
        url: String(reader.result),
        name: file.name || "粘贴图片",
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
function TaskEditor({
  task,
  appearance,
  categories,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task;
  appearance: Appearance;
  categories: string[];
  onChange: (task: Task) => void;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const addFiles = async (files: File[]) => {
    const images = await Promise.all(
      files.filter((f) => f.type.startsWith("image/")).map(imageAttachment),
    );
    if (images.length)
      onChange({
        ...task,
        attachments: [...(task.attachments || []), ...images],
      });
  };
  const paste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.items)
      .filter((x) => x.kind === "file")
      .map((x) => x.getAsFile())
      .filter(Boolean) as File[];
    if (files.length) {
      e.preventDefault();
      void addFiles(files);
    }
  };
  const categoryOptions = categories.map((c) => ({ value: c, label: c }));
  const priorityOptions: [Priority, string][] = [
    ["normal", "普通"],
    ["important", "重要"],
    ["urgent", "紧急"],
  ];
  return createPortal(
    <div
      className="editor-layer"
      style={{
        "--modal-alpha": `${appearance.modalOpacity / 100}`,
        "--modal-blur": `${appearance.modalBlur}px`,
        "--modal-backdrop-blur": `${appearance.modalBackdropBlur}px`,
        "--modal-color": appearance.contentColor,
        "--modal-border-alpha": `${appearance.contentBorderOpacity / 100}`,
        "--modal-shadow": `${appearance.contentShadow}px`,
      } as React.CSSProperties}
    >
      <button
        className="editor-scrim"
        onClick={onClose}
        aria-label="关闭详情"
      />
      <section
        className="task-editor content-glass"
        role="dialog"
        aria-modal="true"
        aria-label="任务详情"
        onPaste={paste}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void addFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <header className="task-editor-head">
          <div>
            <p className="eyebrow">TASK DETAILS</p>
            <h2>{task.title || "新建任务"}</h2>
            <p className="editor-created">创建于 {task.createdAt}</p>
          </div>
          <button onClick={onClose} aria-label="关闭详情">
            <X />
          </button>
        </header>
        <div className="editor-columns">
          <div className="editor-main">
            <label>
              标题
              <input
                autoFocus
                value={task.title}
                onChange={(e) => onChange({ ...task, title: e.target.value })}
              />
            </label>
            <div className="editor-row">
              <label>
                分类
                <GlassSelect
                  label="任务分类"
                  value={task.category}
                  options={categoryOptions}
                  onChange={(category) => onChange({ ...task, category })}
                />
              </label>
              <label>
                优先级
                <GlassSelect
                  label="任务优先级"
                  value={task.priority}
                  options={priorityOptions.map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  onChange={(priority) =>
                    onChange({ ...task, priority: priority as Priority })
                  }
                />
              </label>
            </div>
            <label className="switch">
              <span>全天任务</span>
              <input
                type="checkbox"
                checked={!!task.allDay}
                onChange={(e) =>
                  onChange({ ...task, allDay: e.target.checked })
                }
              />
              <i />
            </label>
            <div className="editor-row">
              <label>
                开始时间
                <input
                  type="datetime-local"
                  value={task.startAt}
                  onChange={(e) =>
                    onChange({
                      ...task,
                      startAt: e.target.value,
                      due: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                结束时间
                <input
                  type="datetime-local"
                  value={task.endAt}
                  onChange={(e) => onChange({ ...task, endAt: e.target.value })}
                />
              </label>
            </div>
            <label className="switch">
              <span>标记为已完成</span>
              <input
                type="checkbox"
                checked={task.done}
                onChange={(e) => onChange({ ...task, done: e.target.checked })}
              />
              <i />
            </label>
          </div>
          <div className="editor-notes">
            <label>
              备注
              <textarea
                value={task.note || ""}
                onChange={(e) => onChange({ ...task, note: e.target.value })}
                placeholder="写下补充说明，或直接 Ctrl/Cmd + V 粘贴图片"
              />
            </label>
            <div className="attachment-drop">
              <ImagePlus />
              <span>粘贴或拖拽图片到这里</span>
              <label>
                选择文件
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    void addFiles(Array.from(e.target.files || []))
                  }
                />
              </label>
            </div>
            <div className="attachment-grid">
              {(task.attachments || []).map((a) => (
                <figure key={a.id}>
                  <img src={a.url} alt={a.name || "任务附件"} />
                  <button
                    onClick={() =>
                      onChange({
                        ...task,
                        attachments: (task.attachments || []).filter(
                          (x) => x.id !== a.id,
                        ),
                      })
                    }
                    aria-label="删除图片"
                  >
                    <X />
                  </button>
                </figure>
              ))}
            </div>
          </div>
        </div>
        <footer>
          {confirmDelete ? (
            <div className="delete-confirm">
              <span>确定删除此任务？</span>
              <button className="quiet" onClick={() => setConfirmDelete(false)}>
                取消
              </button>
              <button className="danger" onClick={() => onDelete(task.id)}>
                确认删除
              </button>
            </div>
          ) : (
            <button className="danger" onClick={() => setConfirmDelete(true)}>
              删除任务
            </button>
          )}
          <div className="editor-save">
            <button className="quiet" onClick={onClose}>
              取消
            </button>
            <button
              className="primary"
              disabled={!task.title.trim()}
              onClick={() => onSave(task)}
            >
              保存任务
            </button>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
function WeekPlanner({
  tasks,
  weekOffset,
  onCreate,
  onOpen,
}: {
  tasks: Task[];
  weekOffset: number;
  onCreate: (date: string, time?: string) => void;
  onOpen: (task: Task) => void;
}) {
  const startHour = 6,
    rowHeight = 58;
  const base = new Date();
  base.setDate(base.getDate() - ((base.getDay() + 6) % 7) + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
  return (
    <section className="week-schedule">
      <div className="week-head-spacer">时间</div>
      {days.map((d, i) => {
        const iso = d.toISOString().slice(0, 10);
        return (
          <header className={iso === today ? "is-today" : ""} key={iso}>
            <span>
              {["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i]}
            </span>
            <b>{d.getDate()}</b>
          </header>
        );
      })}
      <aside className="time-rail">
        <span>全天</span>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i}>{String(startHour + i * 2).padStart(2, "0")}:00</span>
        ))}
      </aside>
      {days.map((d) => {
        const iso = d.toISOString().slice(0, 10);
        const dayTasks = tasks.filter((t) => taskDate(t) === iso);
        const allDay = dayTasks.filter((t) => t.allDay);
        const timed = dayTasks.filter((t) => !t.allDay);
        return (
          <section
            className={`schedule-day ${iso === today ? "is-today" : ""}`}
            key={iso}
          >
            <div className="all-day-lane">
              {allDay.map((t) => (
                <button
                  className={`schedule-task ${t.priority}`}
                  key={t.id}
                  onClick={() => onOpen(t)}
                >
                  {t.title}
                </button>
              ))}
            </div>
            <div className="time-grid">
              {Array.from({ length: 9 }, (_, i) => (
                <button
                  key={i}
                  aria-label={`${iso} ${startHour + i * 2}:00 新建任务`}
                  onClick={() =>
                    onCreate(
                      iso,
                      `${String(startHour + i * 2).padStart(2, "0")}:00`,
                    )
                  }
                />
              ))}
              {timed.map((t) => {
                const start = taskMinutes(t.startAt || t.due),
                  end =
                    taskMinutes(t.endAt || t.startAt || t.due) +
                    (!t.endAt ? 120 : 0);
                const top = Math.max(
                  0,
                  ((start - startHour * 60) / 120) * rowHeight,
                );
                const height = Math.max(
                  28,
                  ((end - start) / 120) * rowHeight - 3,
                );
                return (
                  <button
                    style={{ top, height }}
                    className={`timed-task ${t.priority} ${t.done ? "done" : ""}`}
                    key={t.id}
                    onClick={() => onOpen(t)}
                  >
                    <b>{t.title}</b>
                    <span>
                      {(t.startAt || t.due).slice(11, 16)}–
                      {(t.endAt || "").slice(11, 16)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </section>
  );
}
function YearOverview({
  tasks,
  openMonth,
}: {
  tasks: Task[];
  openMonth: (date: string) => void;
}) {
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i);
  const total = tasks.filter((t) => t.due.startsWith(String(year))).length;
  const done = tasks.filter(
    (t) => t.due.startsWith(String(year)) && t.done,
  ).length;
  return (
    <section className="year-overview">
      <header>
        <div>
          <p className="eyebrow">年度总览</p>
          <h2>{year}，慢慢完成你的计划。</h2>
        </div>
        <p>
          <b>{total}</b> 项任务 ·{" "}
          <b>{total ? Math.round((done / total) * 100) : 0}%</b> 完成
        </p>
      </header>
      <div className="year-grid">
        {months.map((month) => {
          const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
          const monthTasks = tasks.filter((t) => t.due.startsWith(prefix));
          const monthDone = monthTasks.filter((t) => t.done).length;
          return (
            <button
              className={`month-card ${new Date().getMonth() === month ? "current" : ""}`}
              key={month}
              onClick={() => openMonth(`${prefix}-01`)}
            >
              <div>
                <b>{month + 1} 月</b>
                <span>
                  {monthTasks.length} 项 · {monthDone} 完成
                </span>
              </div>
              <div className="month-days">
                {Array.from(
                  { length: new Date(year, month + 1, 0).getDate() },
                  (_, i) => (
                    <i
                      className={
                        monthTasks.some(
                          (t) =>
                            t.due.slice(0, 10) ===
                            `${prefix}-${String(i + 1).padStart(2, "0")}`,
                        )
                          ? "has-task"
                          : ""
                      }
                      key={i}
                    >
                      {i + 1}
                    </i>
                  ),
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
function Appearance({
  a,
  setA,
  reset,
}: {
  a: Appearance;
  setA: (x: Partial<Appearance>) => void;
  reset: () => void;
}) {
  return (
    <div className="settings-body">
      <div>
        <p className="setting-label">界面主题</p>
        <div className="ui-theme-grid">
          {uiThemes.map(([id, name]) => (
            <button
              key={id}
              className={`ui-theme-choice ${id} ${a.uiTheme === id ? "selected" : ""}`}
              onClick={() => setA({ uiTheme: id })}
            >
              <i />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>
      <label className="color">
        <span>自定义文字颜色</span>
        <input
          type="color"
          value={a.textColor}
          onChange={(e) => setA({ textColor: e.target.value })}
        />
      </label>
      <label className="switch">
        <span>开启毛玻璃</span>
        <input
          type="checkbox"
          checked={a.glass}
          onChange={(e) => setA({ glass: e.target.checked })}
        />
        <i />
      </label>
      <label className="switch">
        <span>自动适配背景</span>
        <input
          type="checkbox"
          checked={a.auto}
          onChange={(e) => setA({ auto: e.target.checked })}
        />
        <i />
      </label>
      <Range
        label="工作台模糊"
        value={a.blur}
        min={0}
        max={40}
        unit="px"
        onChange={(blur) => setA({ blur })}
      />
      <Range
        label="工作台不透明度"
        value={a.opacity}
        min={0}
        max={100}
        unit="%"
        onChange={(opacity) => setA({ opacity })}
      />
      <label className="color">
        <span>工作台玻璃颜色</span>
        <input
          type="color"
          value={a.color}
          onChange={(e) => setA({ color: e.target.value })}
        />
      </label>
      <label className="switch">
        <span>柔和边框</span>
        <input
          type="checkbox"
          checked={a.border}
          onChange={(e) => setA({ border: e.target.checked })}
        />
        <i />
      </label>
      <Range
        label="边框透明度"
        value={a.borderOpacity}
        min={0}
        max={100}
        unit="%"
        onChange={(borderOpacity) => setA({ borderOpacity })}
      />
      <label className="switch">
        <span>云朵阴影</span>
        <input
          type="checkbox"
          checked={a.shadow}
          onChange={(e) => setA({ shadow: e.target.checked })}
        />
        <i />
      </label>
      <Range
        label="阴影深度"
        value={a.shadowStrength}
        min={0}
        max={40}
        unit="px"
        onChange={(shadowStrength) => setA({ shadowStrength })}
      />
      <div className="appearance-divider">
        <p className="setting-label">最外层工作台</p>
        <Range
          label="背景不透明度"
          value={a.workbenchOpacity}
          min={0}
          max={100}
          unit="%"
          onChange={(workbenchOpacity) => setA({ workbenchOpacity })}
        />
        <Range
          label="毛玻璃模糊程度"
          value={a.workbenchBlur}
          min={0}
          max={40}
          unit="px"
          onChange={(workbenchBlur) => setA({ workbenchBlur })}
        />
        <label className="color">
          <span>背景颜色</span>
          <input
            type="color"
            value={a.workbenchColor}
            onChange={(e) => setA({ workbenchColor: e.target.value })}
          />
        </label>
        <label className="switch">
          <span>显示工作台边框</span>
          <input
            type="checkbox"
            checked={a.workbenchBorder}
            onChange={(e) => setA({ workbenchBorder: e.target.checked })}
          />
          <i />
        </label>
        <label className="color">
          <span>边框颜色</span>
          <input
            type="color"
            value={a.workbenchBorderColor}
            onChange={(e) => setA({ workbenchBorderColor: e.target.value })}
          />
        </label>
        <Range
          label="边框透明度"
          value={a.workbenchBorderOpacity}
          min={0}
          max={100}
          unit="%"
          onChange={(workbenchBorderOpacity) =>
            setA({ workbenchBorderOpacity })
          }
        />
        <label className="switch">
          <span>显示工作台阴影</span>
          <input
            type="checkbox"
            checked={a.workbenchShadow}
            onChange={(e) => setA({ workbenchShadow: e.target.checked })}
          />
          <i />
        </label>
        <Range
          label="阴影强度"
          value={a.workbenchShadowStrength}
          min={0}
          max={48}
          unit="px"
          onChange={(workbenchShadowStrength) =>
            setA({ workbenchShadowStrength })
          }
        />
        <Range
          label="工作台圆角"
          value={a.workbenchRadius}
          min={0}
          max={48}
          unit="px"
          onChange={(workbenchRadius) => setA({ workbenchRadius })}
        />
      </div>
      <div className="appearance-divider">
        <p className="setting-label">主内容面板</p>
        <label className="switch">
          <span>开启内容层玻璃</span>
          <input
            type="checkbox"
            checked={a.contentGlass}
            onChange={(e) => setA({ contentGlass: e.target.checked })}
          />
          <i />
        </label>
        <label className="switch">
          <span>统一应用到所有面板</span>
          <input
            type="checkbox"
            checked={a.syncGlass}
            onChange={(e) => setA({ syncGlass: e.target.checked })}
          />
          <i />
        </label>
        <Range
          label="内容模糊"
          value={a.contentBlur}
          min={0}
          max={40}
          unit="px"
          onChange={(contentBlur) => setA({ contentBlur })}
        />
        <Range
          label="内容不透明度"
          value={a.contentOpacity}
          min={0}
          max={100}
          unit="%"
          onChange={(contentOpacity) => setA({ contentOpacity })}
        />
        <label className="color">
          <span>内容玻璃颜色</span>
          <input
            type="color"
            value={a.contentColor}
            onChange={(e) => setA({ contentColor: e.target.value })}
          />
        </label>
        <Range
          label="内容边框透明度"
          value={a.contentBorderOpacity}
          min={0}
          max={100}
          unit="%"
          onChange={(contentBorderOpacity) => setA({ contentBorderOpacity })}
        />
        <Range
          label="边缘高光强度"
          value={a.contentHighlight}
          min={0}
          max={100}
          unit="%"
          onChange={(contentHighlight) => setA({ contentHighlight })}
        />
        <Range
          label="内容阴影强度"
          value={a.contentShadow}
          min={0}
          max={40}
          unit="px"
          onChange={(contentShadow) => setA({ contentShadow })}
        />
        <Range
          label="内容圆角"
          value={a.contentRadius}
          min={12}
          max={40}
          unit="px"
          onChange={(contentRadius) => setA({ contentRadius })}
        />
      </div>
      <div className="appearance-divider">
        <p className="setting-label">任务详情窗口</p>
        <Range
          label="窗口背景不透明度"
          value={a.modalOpacity}
          min={0}
          max={100}
          unit="%"
          onChange={(modalOpacity) => setA({ modalOpacity })}
        />
        <Range
          label="窗口毛玻璃模糊程度"
          value={a.modalBlur}
          min={0}
          max={40}
          unit="px"
          onChange={(modalBlur) => setA({ modalBlur })}
        />
        <Range
          label="打开窗口时背景模糊"
          value={a.modalBackdropBlur}
          min={0}
          max={20}
          unit="px"
          onChange={(modalBackdropBlur) => setA({ modalBackdropBlur })}
        />
      </div>
      <Range
        label="正文字号"
        value={a.fontScale}
        min={85}
        max={120}
        unit="%"
        onChange={(fontScale) => setA({ fontScale })}
      />
      <Range
        label="标题字号"
        value={a.titleScale}
        min={85}
        max={125}
        unit="%"
        onChange={(titleScale) => setA({ titleScale })}
      />
      <button className="quiet" onClick={reset}>
        恢复默认外观
      </button>
    </div>
  );
}
function Background({
  a,
  setA,
  backgrounds,
  upload,
  choose,
  remove,
}: {
  a: Appearance;
  setA: (x: Partial<Appearance>) => void;
  backgrounds: BackgroundImage[];
  upload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  choose: (id: string) => void;
  remove: (id: string) => void;
}) {
  return (
    <div className="settings-body">
      <p className="hint">每次只使用一种安静图案，让任务始终清晰好读。</p>
      <div className="preset-grid">
        {presets.map(([id, name]) => (
          <button
            key={id}
            className={`preset theme-${id} ${a.mode === "preset" && a.theme === id ? "selected" : ""}`}
            onClick={() => setA({ mode: "preset", theme: id })}
          >
            <i />
            <span>{name}</span>
          </button>
        ))}
      </div>
      <p className="setting-label">默认背景</p>
      <div className="bg-saved">
        <button
          className={a.mode === "image" && a.image === starterBackgroundId ? "selected" : ""}
          onClick={() => setA({ mode: "image", image: starterBackgroundId })}
        >
          <img src={starterBackgroundUrl} alt="雨天窗边" />
          <span>雨天窗边</span>
        </button>
      </div>
      <p className="setting-label">我的背景收藏</p>
      <label className="upload">
        <ImagePlus /> 上传图片
        <input type="file" accept="image/*" onChange={upload} />
      </label>
      {backgrounds.map((b) => (
        <div className="bg-saved" key={b.id}>
          <button onClick={() => choose(b.id)}>
            <img src={b.url} />
            <span>{b.name}</span>
          </button>
          <button onClick={() => remove(b.id)}>
            <Trash2 />
          </button>
        </div>
      ))}
      {a.mode === "image" && (
        <>
          <Range
            label="图片亮度"
            value={a.brightness}
            min={35}
            max={130}
            unit="%"
            onChange={(brightness) => setA({ brightness })}
          />
          <Range
            label="图片模糊"
            value={a.imageBlur}
            min={0}
            max={20}
            unit="px"
            onChange={(imageBlur) => setA({ imageBlur })}
          />
        </>
      )}
    </div>
  );
}
function Decor({
  a,
  setA,
}: {
  a: Appearance;
  setA: (x: Partial<Appearance>) => void;
}) {
  return (
    <div className="settings-body">
      <p className="hint">
        装饰与工作区分层显示。开启后，可直接拖动页面上的星星。
      </p>
      <label className="switch">
        <span>显示装饰</span>
        <input
          type="checkbox"
          checked={a.decorations}
          onChange={(e) => setA({ decorations: e.target.checked })}
        />
        <i />
      </label>
      <div className="decor-library">
        <span>✦</span>
        <span>♡</span>
        <span>☘</span>
        <span>♪</span>
        <span>〰</span>
      </div>
      <button className="quiet" onClick={() => setA({ decorations: false })}>
        隐藏全部装饰
      </button>
    </div>
  );
}
function Calendar({
  tasks,
  selected,
  setSelected,
  toggle,
  open,
}: {
  tasks: Task[];
  selected: string;
  setSelected: (x: string) => void;
  toggle: (x: string) => void;
  open: (task: Task) => void;
}) {
  const date = new Date(selected + "T12:00:00");
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <section className="calendar-layout">
      <div className="glass calendar">
        <div className="calendar-head">
          <button>
            <ChevronLeft />
          </button>
          <h2>
            {date.toLocaleString("zh-CN", { month: "long", year: "numeric" })}
          </h2>
          <button>
            <ChevronRight />
          </button>
        </div>
        <div className="weekdays">
          {["日", "一", "二", "三", "四", "五", "六"].map((x) => (
            <b key={x}>{x}</b>
          ))}
        </div>
        <div className="dates">
          {Array.from({ length: 6 }, (_, i) => (
            <i key={"blank" + i} />
          ))}
          {days.map((d) => {
            const key = `${selected.slice(0, 8)}${String(d).padStart(2, "0")}`;
            const count = tasks.filter(
              (t) => t.due.slice(0, 10) === key,
            ).length;
            return (
              <button
                key={d}
                className={key === selected ? "today-date" : ""}
                onClick={() => setSelected(key)}
              >
                {d}
                {count > 0 && <small>{count}</small>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="glass selected-day">
        <p className="eyebrow">{selected}</p>
        <h2>当天任务</h2>
        {tasks
          .filter((t) => t.due.slice(0, 10) === selected)
          .map((t) => (
            <article key={t.id} onClick={() => open(t)}>
              <button className="check" onClick={(e) => { e.stopPropagation(); toggle(t.id); }}>
                {t.done && <Check />}
              </button>
              {t.title}
            </article>
          )) || <p className="empty">今天没有安排，留一点呼吸空间。</p>}
      </div>
    </section>
  );
}
export default App;
