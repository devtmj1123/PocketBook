import React, { useState, useMemo } from "react";
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
                      if (cell.dayNum) {
                        setSelectedDayInfo(cell.dayNum);
                      }
                    }}
                    className={`min-h-[76px] rounded-xl border p-1.5 flex flex-col justify-between transition-all cursor-pointer ${
                      cell.dayNum 
                        ? isSelected 
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold" 
                          : isToday 
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200" 
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
                      <div className="space-y-0.5 mt-1 overflow-hidden">
                        {dayTasks.slice(0, 1).map((t) => (
                          <div 
                            key={t.id} 
                            className={`text-[8px] truncate rounded px-1 max-w-full font-sans border ${
                              t.completed 
                                ? "bg-slate-100 text-slate-400 line-through border-transparent" 
                                : "bg-indigo-100/55 text-indigo-700 border-indigo-200/50"
                            }`}
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
          </div>

          {/* EVENT AND TASK QUICK CREATORS */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* QUICK FORM: ADD TRANSACTION OR CALENDAR EVENT */}
            {showAddEvent && (
              <form onSubmit={handleAddNewEvent} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">Log Important Financial Event</span>
                  <button type="button" onClick={() => setShowAddEvent(false)} className="text-[11px] text-slate-400 dark:text-slate-500 cursor-pointer">Hide</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    required
                    placeholder="Payday, Rent payout, Subscription"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg outline-none"
                  />
                  <input 
                    type="number" 
                    placeholder="Affected Amount ($)"
                    value={eventForm.amount}
                    onChange={(e) => setEventForm({ ...eventForm, amount: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg font-mono outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="date" 
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg font-mono outline-none"
                  />
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg outline-none modern-select"
                  >
                    <option value="reminder" className="bg-white dark:bg-slate-900">Financial Reminder</option>
                    <option value="income" className="bg-white dark:bg-slate-900">Guaranteed Income Stream</option>
                    <option value="expense" className="bg-white dark:bg-slate-900">Inescapable Expense</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-mono font-semibold py-1.5 text-xs rounded-lg transition-all hover:bg-emerald-700 cursor-pointer">
                  Commit Event to Calendar
                </button>
              </form>
            )}

            {/* QUICK FORM: ADD TASK */}
            {showAddTask && (
              <form onSubmit={handleAddNewTask} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">Schedule New Task Checklist</span>
                  <button type="button" onClick={() => setShowAddTask(false)} className="text-[11px] text-slate-400 dark:text-slate-500 cursor-pointer">Hide</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Audit electricity bills, Renew parking pass"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg outline-none"
                  />
                  <input 
                    type="number"
                    placeholder="Fee amount if any ($)"
                    value={taskForm.amount}
                    onChange={(e) => setTaskForm({ ...taskForm, amount: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg font-mono outline-none"
                  />
                </div>
                <div>
                  <input 
                    type="date" 
                    required
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg font-mono outline-none"
                  />
                </div>
                <button type="submit" className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-mono font-semibold py-1.5 text-xs rounded-lg transition-all cursor-pointer">
                  Commit To-Do Task
                </button>
              </form>
            )}

          </div>

        </div>

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
                      className="mb-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 flex justify-between items-center gap-2 text-xs"
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
                  className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-slate-55 dark:bg-slate-950 border border-slate-100 dark:border-slate-800"
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
