import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckSquare, 
  Calendar, 
  Plus, 
  Trash2, 
  TrendingUp, 
  CalendarCheck, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Bell, 
  Clock,
  ArrowRight
} from "lucide-react";
import { Task, CalendarEvent } from "../types";

interface TasksAndCalendarProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  addSystemEvent: (title: string, amount: number, type: "income" | "expense" | "reminder") => void;
}

export default function TasksAndCalendar({
  tasks,
  setTasks,
  events,
  setEvents,
  addSystemEvent,
}: TasksAndCalendarProps) {
  // Calendar variables
  const currentYear = 2026;
  const currentMonthIdx = 4; // May (0-indexed, so 4 is May)
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const [selectedDayInfo, setSelectedDayInfo] = useState<number | null>(24);
  const [choiceDate, setChoiceDate] = useState<string | null>(null);
  const [draggedOverDate, setDraggedOverDate] = useState<string | null>(null);

  // Forms state
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    dueDate: "2026-05-24",
    amount: "",
  });

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    date: "2026-05-24",
    amount: "",
    type: "reminder" as "income" | "expense" | "reminder",
    notes: "",
  });

  // Calculate calendar grid days for May 2026
  // May 1st 2026 is a Friday (checked or computed: 2026-05-01 is Friday, day-of-week index 5)
  // May has 31 days.
  const calendarGrid = useMemo(() => {
    const firstDayOfWeek = 5; // Friday (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
    const totalDays = 31;
    const gridDays: Array<{ dayNum: number | null; isoString: string | null }> = [];

    // Padding for starting offset (empty cells preceding May 1st)
    for (let i = 0; i < firstDayOfWeek; i++) {
      gridDays.push({ dayNum: null, isoString: null });
    }

    // Days of the month
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      gridDays.push({
        dayNum: d,
        isoString: `2026-05-${dayStr}`,
      });
    }

    return gridDays;
  }, []);

  // Filter tasks & events matching selected day
  const formattedSelectedIso = useMemo(() => {
    if (!selectedDayInfo) return null;
    const padded = selectedDayInfo < 10 ? `0${selectedDayInfo}` : `${selectedDayInfo}`;
    return `2026-05-${padded}`;
  }, [selectedDayInfo]);

  const activeDayTasks = useMemo(() => {
    if (!formattedSelectedIso) return [];
    return tasks.filter((t) => t.dueDate === formattedSelectedIso);
  }, [tasks, formattedSelectedIso]);

  const activeDayEvents = useMemo(() => {
    if (!formattedSelectedIso) return [];
    return events.filter((e) => e.date === formattedSelectedIso);
  }, [events, formattedSelectedIso]);

  // Tasks actions
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    const parsedAmount = parseFloat(taskForm.amount);
    const addedTask: Task = {
      id: "task_" + Date.now(),
      title: taskForm.title.trim(),
      completed: false,
      dueDate: taskForm.dueDate,
      amount: isNaN(parsedAmount) ? undefined : parsedAmount,
    };

    setTasks((prev) => [addedTask, ...prev]);

    // Automatically trigger visual alert registry on the calendar
    if (addedTask.amount) {
      addSystemEvent(
        `Task bill: ${addedTask.title}`, 
        addedTask.amount, 
        "expense"
      );
    }

    setTaskForm({ title: "", dueDate: "2026-05-24", amount: "" });
    setShowAddTask(false);
  };

  const handleToggleTaskStatus = (id: string) => {
    setTasks((prev) => 
      prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Events actions
  const handleAddNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) return;

    const parsedAmt = parseFloat(eventForm.amount);
    const addedEvent: CalendarEvent = {
      id: "ev_" + Date.now(),
      title: eventForm.title.trim(),
      date: eventForm.date,
      amount: isNaN(parsedAmt) ? undefined : parsedAmt,
      type: eventForm.type,
      notes: eventForm.notes,
    };

    setEvents((prev) => [...prev, addedEvent]);

    setEventForm({
      title: "",
      date: "2026-05-24",
      amount: "",
      type: "reminder",
      notes: "",
    });
    setShowAddEvent(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6" id="calendar-tasks-workspace">
      
      {/* HEADER EXPLANATORY ROW */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Financial Timeline Scheduler</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-xl">
            Match scheduled bills, subscriptions, checkouts, and custom paydays directly with May 2026 calendar days to avoid negative bank balances.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="btn-trigger-add-task-panel"
            onClick={() => setShowAddTask(!showAddTask)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl transition-all"
          >
            + Schedule Task
          </button>
          <button
            id="btn-trigger-add-event-panel"
            onClick={() => setShowAddEvent(!showAddEvent)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl transition-all"
          >
            + Log Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INTERACTIVE CALENDAR GRID */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between" id="calendar-grid-wrapper">
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> May 2026 Scheduler
              </h3>
              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg">
                Active Year: 2026
              </span>
            </div>

            {/* DAY NAME LABELS */}
            <div className="grid grid-cols-7 text-center text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase font-bold tracking-widest pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* MONTHLY CELLS */}
            <div className="grid grid-cols-7 gap-1.5" id="calendar-day-cells">
              {calendarGrid.map((cell, idx) => {
                const isSelected = cell.dayNum === selectedDayInfo;
                const isToday = cell.dayNum === 24; // Current local time is specified in metadata as 24th May 2026!

                // Filter occurrences for this day
                const dayTasks = cell.isoString ? tasks.filter((t) => t.dueDate === cell.isoString) : [];
                const dayEvents = cell.isoString ? events.filter((e) => e.date === cell.isoString) : [];

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (cell.dayNum && cell.isoString) {
                        setSelectedDayInfo(cell.dayNum);
                        setChoiceDate(cell.isoString);
                        // Pre-populate forms
                        setTaskForm(prev => ({ ...prev, dueDate: cell.isoString as string }));
                        setEventForm(prev => ({ ...prev, date: cell.isoString as string }));
                      }
                    }}
                    onDragOver={(e) => {
                      if (cell.isoString) {
                        e.preventDefault();
                      }
                    }}
                    onDragEnter={() => {
                      if (cell.isoString) {
                        setDraggedOverDate(cell.isoString);
                      }
                    }}
                    onDragLeave={() => {
                      if (draggedOverDate === cell.isoString) {
                        setDraggedOverDate(null);
                      }
                    }}
                    onDrop={(e) => {
                      if (!cell.isoString) return;
                      e.preventDefault();
                      setDraggedOverDate(null);
                      const taskId = e.dataTransfer.getData("text/plain");
                      if (taskId) {
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === taskId ? { ...t, dueDate: cell.isoString as string } : t
                          )
                        );
                      }
                    }}
                    className={`min-h-[76px] rounded-xl border p-1.5 flex flex-col justify-between transition-all cursor-pointer ${
                      cell.dayNum 
                        ? draggedOverDate === cell.isoString
                          ? "bg-indigo-100 dark:bg-indigo-900 border-indigo-550 text-indigo-950 dark:text-indigo-100 scale-[1.02] shadow-md"
                          : isSelected 
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold" 
                            : isToday 
                              ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200" 
                              : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        : "bg-slate-50/50 dark:bg-slate-950/20 border-transparent invisible cursor-default"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[11px] font-mono leading-none ${isToday ? "font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1 rounded" : ""}`}>
                        {cell.dayNum}
                      </span>
                      {cell.dayNum && (dayTasks.length > 0 || dayEvents.length > 0) && (
                        <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                      )}
                    </div>

                    {/* Miniature content stack inside cell */}
                    {cell.dayNum && (
                      <div className="space-y-0.5 mt-1 overflow-hidden" draggable={false}>
                        {dayTasks.slice(0, 2).map((t) => (
                          <div 
                            key={t.id} 
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", t.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            className={`text-[8px] truncate rounded px-1 max-w-full font-sans border cursor-grab active:cursor-grabbing ${
                              t.completed 
                                ? "bg-slate-100 text-slate-400 line-through border-transparent" 
                                : "bg-indigo-100/55 text-indigo-700 border-indigo-200/50 hover:bg-indigo-200 transition-colors"
                            }`}
                            title="Drag task onto any calendar card day to reschedule!"
                          >
                            ✓ {t.title}
                          </div>
                        ))}
                        {dayEvents.slice(0, 1).map((ev) => (
                          <div 
                            key={ev.id} 
                            className={`text-[8px] truncate rounded px-1 font-mono font-medium ${
                              ev.type === "income" 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                                : ev.type === "expense" 
                                  ? "bg-rose-50 text-rose-800 border-rose-100" 
                                  : "bg-amber-50 text-amber-800 border-amber-100"
                            }`}
                          >
                            ${ev.amount || 0} {ev.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>        </div>

        {/* INLINE ANIMATED OVERLAY MODALS FOR ADD TASK, ADD EVENT AND POPUP CHOICE ACROSS APPLICATION */}
        <AnimatePresence>
          {showAddEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-emerald-500" /> Log Financial Event
                  </h3>
                  <button type="button" onClick={() => setShowAddEvent(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer">&times;</button>
                </div>

                <form onSubmit={handleAddNewEvent} className="space-y-4 font-sans">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Title / Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Payday, Rent payout, Subscription"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Amount ($)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 1500"
                        value={eventForm.amount}
                        onChange={(e) => setEventForm({ ...eventForm, amount: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl font-mono outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Event Date</label>
                      <input 
                        type="date" 
                        required
                        value={eventForm.date}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl font-mono outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Flow Type</label>
                    <select
                      value={eventForm.type}
                      onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as any })}
                      className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="reminder">Financial Reminder</option>
                      <option value="income">Guaranteed Income Stream</option>
                      <option value="expense">Inescapable Expense</option>
                    </select>
                  </div>

                  <button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-semibold py-3 text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-250/20 dark:shadow-none">
                    Commit Event to Calendar
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}

          {showAddTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-indigo-500" /> Schedule Task Checklist
                  </h3>
                  <button type="button" onClick={() => setShowAddTask(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer">&times;</button>
                </div>

                <form onSubmit={handleAddNewTask} className="space-y-4 font-sans">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Task Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Audit electricity bills, Renew parking pass"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Fee Amount ($ if any)</label>
                      <input 
                        type="number"
                        placeholder="e.g. 45"
                        value={taskForm.amount}
                        onChange={(e) => setTaskForm({ ...taskForm, amount: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl font-mono outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Due Date</label>
                      <input 
                        type="date" 
                        required
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl font-mono outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full mt-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-mono font-semibold py-3 text-xs rounded-xl transition-all cursor-pointer shadow-md">
                    Commit To-Do Task
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}

          {choiceDate !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-xl text-center space-y-4"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">Action Scheduler</span>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base mt-1">
                    May {parseInt(choiceDate.split("-")[2], 10)}, 2026
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Schedule a new checklist task or log a financial transaction event on this calendar day.
                </p>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowAddTask(true);
                      setChoiceDate(null);
                    }}
                    className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-150"
                  >
                    <CheckSquare className="w-4 h-4" /> Schedule Task Checklist
                  </button>
                  <button
                    onClick={() => {
                      setShowAddEvent(true);
                      setChoiceDate(null);
                    }}
                    className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-150"
                  >
                    <CalendarCheck className="w-4 h-4" /> Log Financial Event
                  </button>
                  <button
                    onClick={() => setChoiceDate(null)}
                    className="w-full p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel / View Details
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DETAILED DAILY ACTION PANEL */}
        <div className="space-y-6" id="daily-breakdown-panel">
          
          {/* Active calendar day schedule */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between min-h-[300px]" id="selected-day-schedule">
            
            <div>
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">Inspecting timeline:</span>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base" id="selected-day-headline">
                  {selectedDayInfo ? `May ${selectedDayInfo}, 2026` : "Select a day in calendar"}
                </h4>
              </div>

              {/* Items allocated to selected day */}
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                
                {/* Events list */}
                <div>
                  <h5 className="text-[10px] font-mono tracking-wider text-slate-400 dark:text-slate-500 font-bold uppercase mb-2">Events & Reminders</h5>
                  {activeDayEvents.map((ev) => (
                    <div 
                      key={ev.id} 
                      className={`mb-2 p-2.5 rounded-xl border flex justify-between items-start gap-2 ${
                        ev.type === "income" 
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300" 
                          : ev.type === "expense" 
                            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-300" 
                            : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-300"
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block truncate">{ev.title}</span>
                        {ev.notes && <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{ev.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {ev.amount && (
                          <span className="text-xs font-mono font-bold">${ev.amount.toFixed(0)}</span>
                        )}
                        <button 
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}

                  {activeDayEvents.length === 0 && (
                    <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 italic">No formal events logged today.</p>
                  )}
                </div>

                {/* Tasks list */}
                <div>
                  <h5 className="text-[10px] font-mono tracking-wider text-slate-400 dark:text-slate-500 font-bold uppercase mb-2">Checklists due today</h5>
                  {activeDayTasks.map((t) => (
                    <div 
                      key={t.id} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", t.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="mb-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 flex justify-between items-center gap-2 text-xs cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                      title="Drag to update due date on calendar!"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button 
                          onClick={() => handleToggleTaskStatus(t.id)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          {t.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-455" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span className={`truncate font-medium ${t.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-305"}`}>
                          {t.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {t.amount && <span className="text-xs font-mono text-slate-500 dark:text-slate-405">${t.amount}</span>}
                        <button 
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-slate-300 hover:text-red-500 font-mono text-sm ml-1 cursor-pointer"
                          title="Delete Task"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}

                  {activeDayTasks.length === 0 && (
                    <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 italic">No task checklists mapped here.</p>
                  )}
                </div>

              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-50 dark:border-slate-855">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block mb-1">Interactive Action Hook:</span>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Logged items will populate the calendar rings to calculate cash balance forecasts for the weeks ahead.
              </p>
            </div>

          </div>

          {/* ALL PENDING TASKS CHECKLIST (Quick access roll) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6" id="all-tasks-audit-box">
            
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Audits</span>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Comprehensive Checklist</h4>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {tasks.filter((t) => !t.completed).length} items remaining
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {tasks.map((t) => (
                <div 
                  key={t.id} 
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", t.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-slate-55 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                  title="Drag task onto any calendar date to reschedule!"
                >
                  <div className="flex items-center gap-2 min-w-0 text-xs">
                    <button onClick={() => handleToggleTaskStatus(t.id)} className="cursor-pointer">
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                    <div className="truncate text-left">
                      <span className={`font-semibold block ${t.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                        {t.title}
                      </span>
                      <span className="block text-[9px] font-mono text-slate-400 dark:text-slate-500">Due Date: {t.dueDate}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeleteTask(t.id)}
                    className="text-slate-300 dark:text-slate-600 hover:text-red-500 text-xs cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="text-center py-6 text-slate-300 dark:text-slate-600 text-xs font-mono">
                  No billing checklist tasks logged yet.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
