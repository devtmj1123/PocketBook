import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Sparkles, 
  CalendarDays, 
  TrendingUp, 
  Sliders, 
  BookOpen,
  LineChart,
  Sun,
  Moon,
  Lock,
  LogOut,
  SlidersHorizontal,
  FolderLock,
  Trash2,
  Loader2,
  Bell,
  BellOff,
  CheckCheck,
  Settings
} from "lucide-react";

// Firebase and Auth modules
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";

// Cryptography helper
import { encryptText, decryptText } from "./lib/encryption";

// Components
import FinanceDashboard from "./components/FinanceDashboard";
import NotionNotes from "./components/NotionNotes"; // We will style and clean occurrences of "notion" in this component
import TasksAndCalendar from "./components/TasksAndCalendar";
import AiAssistant from "./components/AiAssistant";
import AuthScreen from "./components/AuthScreen";
import ProfileSettings from "./components/ProfileSettings";

// Types
import { Transaction, Budget, SavingsGoal, NotionNote, Task, CalendarEvent, CustomTag, ChatMessage, AppNotification } from "./types";

export default function App() {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [encryptionPin, setEncryptionPin] = useState("1234");
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "notes" | "calendar" | "advisor" | "settings">("dashboard");

  // Global theme
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // DB Clearance States
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeStatusMessage, setWipeStatusMessage] = useState("");

  // Finance and Notebook actual lists loaded from DB
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);

  const [tags, setTags] = useState<CustomTag[]>([
    { id: "t1", name: "Groceries", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { id: "t2", name: "Luxuries", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300" },
    { id: "t3", name: "Rent-Payment", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
    { id: "t4", name: "Subscriptions", color: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300" },
    { id: "t5", name: "Investments", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
  ]);

  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [notes, setNotes] = useState<NotionNote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Real-time notification and alerts state backed by Firestore
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Desktop Notifications Permission & Synchronization
  const [notificationPermission, setNotificationPermission] = useState<"default" | "granted" | "denied">(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  const requestDesktopPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const result = await Notification.requestPermission();
        setNotificationPermission(result);
        if (result === "granted") {
          new Notification("PocketBook Premium", {
            body: "Desktop alerts successfully enabled! 🚀",
          });
        }
      } catch (err) {
        console.error("Error requesting Notification permission:", err);
      }
    }
  };

  const isFirstLoad = React.useRef(true);
  const prevNotifIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (notifications.length === 0) return;

    if (isFirstLoad.current) {
      // Initialize with existing notification IDs to avoid alerting them again on initial load
      const ids = new Set(notifications.map(n => n.id));
      prevNotifIdsRef.current = ids;
      isFirstLoad.current = false;
      return;
    }

    // Identify and notice any new unread notifications
    notifications.forEach((n) => {
      if (!prevNotifIdsRef.current.has(n.id)) {
        prevNotifIdsRef.current.add(n.id);
        
        if (!n.read && notificationPermission === "granted" && typeof window !== "undefined" && "Notification" in window) {
          try {
            new Notification(n.title, {
              body: n.message,
            });
          } catch (err) {
            console.error("Error dispatching desktop notification:", err);
          }
        }
      }
    });
  }, [notifications, notificationPermission]);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your AI Finance Companion. I have fully indexed your monthly checkout registers, allowances, saving horizons, and schedule tasks. Ask me anything about category spending optimizations, cash forecasting, or goals viability!",
      timestamp: "09:00 AM",
    }
  ]);

  const [currentSelectedNoteId, setCurrentSelectedNoteId] = useState<string | null>(null);

  // Apply theme class to HTML node
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user basic profile settings
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const snap = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const profile = docSnap.data();
              if (profile.theme) setTheme(profile.theme as "light" | "dark");
              if (profile.monthlyIncome !== undefined) setMonthlyIncome(profile.monthlyIncome);
            }
          }, (err) => {
            handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          });
        } catch (err) {
          console.error("Could not load user properties profile:", err);
        }
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync state functions that write to Firestore under private directories
  const syncExpensesToDb = async (nextList: Transaction[]) => {
    if (!user) return;
    try {
      const currentIds = nextList.map(item => item.id);
      
      // Delete old removed
      for (const oldTx of expenses) {
        if (!currentIds.includes(oldTx.id)) {
          await deleteDoc(doc(db, "users", user.uid, "transactions", oldTx.id));
        }
      }
      // Upsert created/updated items
      for (const item of nextList) {
        const encryptedTitle = encryptText(item.title, encryptionPin);
        const encryptedNotes = item.notes ? encryptText(item.notes, encryptionPin) : "";
        
        await setDoc(doc(db, "users", user.uid, "transactions", item.id), {
          id: item.id,
          title: encryptedTitle,
          amount: item.amount,
          category: item.category,
          date: item.date,
          tag: item.tag || "None",
          notes: encryptedNotes,
          encrypted: true,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transactions`);
    }
  };

  const syncBudgetsToDb = async (nextList: Budget[]) => {
    if (!user) return;
    try {
      const currentIds = nextList.map(item => item.id);
      for (const oldB of budgets) {
        if (!currentIds.includes(oldB.id)) {
          await deleteDoc(doc(db, "users", user.uid, "budgets", oldB.id));
        }
      }
      for (const item of nextList) {
        await setDoc(doc(db, "users", user.uid, "budgets", item.id), {
          id: item.id,
          category: encryptText(item.category, encryptionPin),
          limit: item.limit,
          spent: item.spent,
          encrypted: true,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/budgets`);
    }
  };

  const syncSavingsGoalsToDb = async (nextList: SavingsGoal[]) => {
    if (!user) return;
    try {
      const currentIds = nextList.map(item => item.id);
      for (const oldG of savingsGoals) {
        if (!currentIds.includes(oldG.id)) {
          await deleteDoc(doc(db, "users", user.uid, "savingsGoals", oldG.id));
        }
      }
      for (const item of nextList) {
        await setDoc(doc(db, "users", user.uid, "savingsGoals", item.id), {
          id: item.id,
          name: encryptText(item.name, encryptionPin),
          target: item.target,
          current: item.current,
          targetDate: item.targetDate,
          description: item.description ? encryptText(item.description, encryptionPin) : "",
          encrypted: true,
          category: item.category || "General",
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/savingsGoals`);
    }
  };

  const syncNotesToDb = async (nextList: NotionNote[]) => {
    if (!user) return;
    try {
      const currentIds = nextList.map(item => item.id);
      for (const oldN of notes) {
        if (!currentIds.includes(oldN.id)) {
          await deleteDoc(doc(db, "users", user.uid, "notes", oldN.id));
        }
      }
      for (const item of nextList) {
        const blocksStr = JSON.stringify(item.blocks);
        const encryptedBlocks = encryptText(blocksStr, encryptionPin);
        
        await setDoc(doc(db, "users", user.uid, "notes", item.id), {
          id: item.id,
          title: encryptText(item.title, encryptionPin),
          blocksJson: encryptedBlocks,
          tags: item.tags || [],
          encrypted: true,
          updatedAt: item.updatedAt || new Date().toISOString().split("T")[0]
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/notes`);
    }
  };

  const syncTasksToDb = async (nextList: Task[]) => {
    if (!user) return;
    try {
      const currentIds = nextList.map(item => item.id);
      for (const oldT of tasks) {
        if (!currentIds.includes(oldT.id)) {
          await deleteDoc(doc(db, "users", user.uid, "tasks", oldT.id));
        }
      }
      for (const item of nextList) {
        await setDoc(doc(db, "users", user.uid, "tasks", item.id), {
          id: item.id,
          title: encryptText(item.title, encryptionPin),
          completed: item.completed,
          dueDate: item.dueDate,
          amount: item.amount || null,
          category: item.category || "General",
          encrypted: true,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/tasks`);
    }
  };

  const syncEventsToDb = async (nextList: CalendarEvent[]) => {
    if (!user) return;
    try {
      const currentIds = nextList.map(item => item.id);
      for (const oldE of events) {
        if (!currentIds.includes(oldE.id)) {
          await deleteDoc(doc(db, "users", user.uid, "events", oldE.id));
        }
      }
      for (const item of nextList) {
        await setDoc(doc(db, "users", user.uid, "events", item.id), {
          id: item.id,
          title: encryptText(item.title, encryptionPin),
          date: item.date,
          amount: item.amount || null,
          type: item.type,
          notes: item.notes ? encryptText(item.notes, encryptionPin) : "",
          completed: item.completed || false,
          encrypted: true,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/events`);
    }
  };

  // State Proxies with realtime firestore triggers
  const setExpensesWithSync = (updater: React.SetStateAction<Transaction[]>) => {
    setExpenses((prev) => {
      const nextList = typeof updater === "function" ? updater(prev) : updater;
      syncExpensesToDb(nextList);
      return nextList;
    });
  };

  const setBudgetsWithSync = (updater: React.SetStateAction<Budget[]>) => {
    setBudgets((prev) => {
      const nextList = typeof updater === "function" ? updater(prev) : updater;
      syncBudgetsToDb(nextList);
      return nextList;
    });
  };

  const setSavingsGoalsWithSync = (updater: React.SetStateAction<SavingsGoal[]>) => {
    setSavingsGoals((prev) => {
      const nextList = typeof updater === "function" ? updater(prev) : updater;
      syncSavingsGoalsToDb(nextList);
      return nextList;
    });
  };

  const setNotesWithSync = (updater: React.SetStateAction<NotionNote[]>) => {
    setNotes((prev) => {
      const nextList = typeof updater === "function" ? updater(prev) : updater;
      syncNotesToDb(nextList);
      return nextList;
    });
  };

  const setTasksWithSync = (updater: React.SetStateAction<Task[]>) => {
    setTasks((prev) => {
      const nextList = typeof updater === "function" ? updater(prev) : updater;
      syncTasksToDb(nextList);
      return nextList;
    });
  };

  const setEventsWithSync = (updater: React.SetStateAction<CalendarEvent[]>) => {
    setEvents((prev) => {
      const nextList = typeof updater === "function" ? updater(prev) : updater;
      syncEventsToDb(nextList);
      return nextList;
    });
  };

  const handleSetMonthlyIncome = async (newVal: number) => {
    setMonthlyIncome(newVal);
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), { monthlyIncome: newVal }, { merge: true });
      } catch (err) {
        console.error("Failed to commit main monthly income state:", err);
      }
    }
  };

  // Real-time subscribers triggered when authentication is success and PIN is provided
  useEffect(() => {
    if (!user) return;

    // Monitor Transactions
    const unSubTx = onSnapshot(
      collection(db, "users", user.uid, "transactions"),
      (snap) => {
        const items: Transaction[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data();
          items.push({
            id: raw.id,
            title: raw.encrypted ? decryptText(raw.title, encryptionPin) : raw.title,
            amount: raw.amount,
            category: raw.category,
            date: raw.date,
            tag: raw.tag,
            notes: raw.encrypted && raw.notes ? decryptText(raw.notes, encryptionPin) : raw.notes || "",
          });
        });
        // Sort in descending order of dates
        items.sort((a, b) => b.date.localeCompare(a.date));
        setExpenses(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/transactions`);
      }
    );

    // Monitor Budgets
    const unSubB = onSnapshot(
      collection(db, "users", user.uid, "budgets"),
      (snap) => {
        const items: Budget[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data();
          items.push({
            id: raw.id,
            category: raw.encrypted ? decryptText(raw.category, encryptionPin) : raw.category,
            limit: raw.limit,
            spent: raw.spent,
          });
        });
        setBudgets(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/budgets`);
      }
    );

    // Monitor SavingsGoals
    const unSubG = onSnapshot(
      collection(db, "users", user.uid, "savingsGoals"),
      (snap) => {
        const items: SavingsGoal[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data();
          items.push({
            id: raw.id,
            name: raw.encrypted ? decryptText(raw.name, encryptionPin) : raw.name,
            target: raw.target,
            current: raw.current,
            targetDate: raw.targetDate,
            description: raw.encrypted && raw.description ? decryptText(raw.description, encryptionPin) : raw.description || "",
            category: raw.category,
          });
        });
        setSavingsGoals(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/savingsGoals`);
      }
    );

    // Monitor Notes
    const unSubNotes = onSnapshot(
      collection(db, "users", user.uid, "notes"),
      (snap) => {
        const items: NotionNote[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data();
          let decryptedBlocks: any[] = [];
          try {
            const rawBlocksStr = raw.encrypted ? decryptText(raw.blocksJson, encryptionPin) : raw.blocksJson;
            decryptedBlocks = JSON.parse(rawBlocksStr || "[]");
          } catch {
            decryptedBlocks = [];
          }
          items.push({
            id: raw.id,
            title: raw.encrypted ? decryptText(raw.title, encryptionPin) : raw.title,
            blocks: decryptedBlocks,
            tags: raw.tags || [],
            updatedAt: raw.updatedAt || "",
          });
        });
        setNotes(items);
        // Auto assign active note id
        if (items.length > 0 && !currentSelectedNoteId) {
          setCurrentSelectedNoteId(items[0].id);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/notes`);
      }
    );

    // Monitor Tasks
    const unSubTasks = onSnapshot(
      collection(db, "users", user.uid, "tasks"),
      (snap) => {
        const items: Task[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data();
          items.push({
            id: raw.id,
            title: raw.encrypted ? decryptText(raw.title, encryptionPin) : raw.title,
            completed: raw.completed,
            dueDate: raw.dueDate,
            amount: raw.amount || undefined,
            category: raw.category || undefined,
          });
        });
        setTasks(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/tasks`);
      }
    );

    // Monitor Events
    const unSubEvents = onSnapshot(
      collection(db, "users", user.uid, "events"),
      (snap) => {
        const items: CalendarEvent[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data();
          items.push({
            id: raw.id,
            title: raw.encrypted ? decryptText(raw.title, encryptionPin) : raw.title,
            date: raw.date,
            amount: raw.amount || undefined,
            type: raw.type,
            notes: raw.encrypted && raw.notes ? decryptText(raw.notes, encryptionPin) : raw.notes || "",
            completed: raw.completed || false,
          });
        });
        setEvents(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/events`);
      }
    );

    // Monitor Notifications
    const unSubNotifications = onSnapshot(
      collection(db, "users", user.uid, "notifications"),
      (snap) => {
        const items: AppNotification[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data();
          items.push({
            id: raw.id,
            title: raw.encrypted && raw.title ? decryptText(raw.title, encryptionPin) : raw.title || "Alert",
            message: raw.encrypted && raw.message ? decryptText(raw.message, encryptionPin) : raw.message || "",
            type: raw.type || "system",
            date: raw.date || "",
            read: raw.read || false,
            referenceId: raw.referenceId || undefined,
          });
        });
        // Sort by newest first
        items.sort((a, b) => b.id.localeCompare(a.id));
        setNotifications(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/notifications`);
      }
    );

    return () => {
      unSubTx();
      unSubB();
      unSubG();
      unSubNotes();
      unSubTasks();
      unSubEvents();
      unSubNotifications();
    };
  }, [user, encryptionPin]);

  // Auth handle triggers
  const handleAuthSuccess = (uid: string) => {
    console.log("User authenticated in real-time mode:", uid);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setExpenses([]);
      setBudgets([]);
      setSavingsGoals([]);
      setNotes([]);
      setTasks([]);
      setEvents([]);
    } catch (err) {
      console.error("Logout clearance error:", err);
    }
  };

  const handleClearAllData = async () => {
    if (!user) return;
    setIsWiping(true);
    setWipeStatusMessage("Connecting to real-time sync nodes...");
    try {
      // Direct local state reset to make the UI immediately updated
      setExpenses([]);
      setBudgets([]);
      setSavingsGoals([]);
      setNotes([]);
      setTasks([]);
      setEvents([]);
      setNotifications([]);
      setMonthlyIncome(0);

      // Overwrite users profile to reset income
      await setDoc(doc(db, "users", user.uid), { monthlyIncome: 0 }, { merge: true });

      const collectionsToClear = ["transactions", "budgets", "savingsGoals", "notes", "tasks", "events", "notifications"];
      for (const colName of collectionsToClear) {
        setWipeStatusMessage(`Purging cloud collection: ${colName}...`);
        const querySnap = await getDocs(collection(db, "users", user.uid, colName));
        for (const docSnap of querySnap.docs) {
          await deleteDoc(doc(db, "users", user.uid, colName, docSnap.id));
        }
      }
      setWipeStatusMessage("Secure cloud database purged successfully!");
      setTimeout(() => {
        setShowClearConfirm(false);
        setIsWiping(false);
        setWipeStatusMessage("");
      }, 1500);
    } catch (err) {
      console.error("Database purge failed:", err);
      setWipeStatusMessage("Purge failed. Insufficient database permissions or connectivity issues.");
      setTimeout(() => {
        setIsWiping(false);
      }, 3050);
    }
  };

  // Notification action handlers (persisted to Firestore)
  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "notifications", id), { read: true }, { merge: true });
    } catch (err) {
      console.error("Error setting notification read status:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      for (const n of unreadNotifs) {
        await setDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true }, { merge: true });
      }
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "notifications", id));
    } catch (err) {
      console.error("Error removing notification document:", err);
    }
  };

  // Live checker for Task boundaries and Calendar upcoming events
  useEffect(() => {
    if (!user || !encryptionPin || (tasks.length === 0 && events.length === 0)) {
      return;
    }

    const scannerTimer = setTimeout(() => {
      const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      const runScheduleChecks = async () => {
        try {
          // Process tasks that are due today or in the past, and NOT completed
          for (const t of tasks) {
            if (!t.completed && t.dueDate) {
              const overdue = t.dueDate < todayStr;
              const isToday = t.dueDate === todayStr;

              if (overdue || isToday) {
                const uniqueNotifId = `notif-task-${t.id}-${t.dueDate}`;
                const matched = notifications.some(n => n.id === uniqueNotifId);

                if (!matched) {
                  const titleMsg = overdue ? "Overdue Task Deadline!" : "Task Deadline Today";
                  const bodyMsg = overdue 
                    ? `Audit Checklist item "${t.title}" is overdue since ${t.dueDate}.` 
                    : `Complete task "${t.title}" scheduled for today.`;

                  await setDoc(doc(db, "users", user.uid, "notifications", uniqueNotifId), {
                    id: uniqueNotifId,
                    title: encryptText(titleMsg, encryptionPin),
                    message: encryptText(bodyMsg, encryptionPin),
                    type: "task",
                    date: todayStr,
                    read: false,
                    referenceId: t.id,
                    encrypted: true,
                    createdAt: new Date().toISOString()
                  });
                }
              }
            }
          }

          // Process events happening today
          for (const ev of events) {
            if (ev.date === todayStr && !ev.completed) {
              const uniqueNotifId = `notif-event-${ev.id}-${ev.date}`;
              const matched = notifications.some(n => n.id === uniqueNotifId);

              if (!matched) {
                const titleMsg = ev.type === "reminder" ? "Real-time Bill / Reminder" : "Upcoming Event Today";
                const bodyMsg = `Your ${ev.type}: "${ev.title}" is scheduled for today.`;

                await setDoc(doc(db, "users", user.uid, "notifications", uniqueNotifId), {
                  id: uniqueNotifId,
                  title: encryptText(titleMsg, encryptionPin),
                  message: encryptText(bodyMsg, encryptionPin),
                  type: "event",
                  date: todayStr,
                  read: false,
                  referenceId: ev.id,
                  encrypted: true,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        } catch (err) {
          console.error("Alert automation failed to sync:", err);
        }
      };

      runScheduleChecks();
    }, 2000); // 2 second delay to let main components finish loading states

    return () => clearTimeout(scannerTimer);
  }, [user, tasks, events, encryptionPin, notifications.length]);

  // Auxiliary handler to programmatically register calendar reminders
  const addSystemEventWithSync = (title: string, amount: number, type: "income" | "expense" | "reminder") => {
    const fresh: CalendarEvent = {
      id: "ev_sys_" + Date.now(),
      title,
      date: new Date().toISOString().split("T")[0],
      amount,
      type,
    };
    setEventsWithSync((prev) => [...prev, fresh]);
  };

  // Theme Toggler
  const toggleTheme = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), { theme: nextTheme }, { merge: true });
      } catch (err) {
        console.error("Failed to persist theme switch setting:", err);
      }
    }
  };

  // While firebase auth state boots up
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <Sparkles className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <span className="text-xs font-mono font-bold text-slate-400 animate-pulse tracking-widest uppercase">
          Unlocking Secure Vault System...
        </span>
      </div>
    );
  }

  // Not authorized state
  if (!user) {
    return (
      <AuthScreen 
        onAuthSuccess={handleAuthSuccess} 
        setEncryptionPinAction={setEncryptionPin} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300" id="pocketbook-app-container">
      
      {/* SINGLE UNIFIED COHESIVE TOPBAR */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 shadow-2xs px-6 py-3" id="app-top-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Left: Logo & Meta descriptors */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4 font-bold" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                PocketBook <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Premium</span>
              </h1>
              <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 block mt-1 uppercase tracking-widest leading-none font-bold">
                GROUNDED FINANCIAL PLATFORM
              </span>
            </div>
          </div>

          {/* Middle: Integrated Navigation Pills */}
          <nav className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/10 dark:border-slate-800/20" id="app-navigation-bar">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Allowances
            </button>
            
            <button
              id="nav-tab-notes"
              onClick={() => setActiveTab("notes")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "notes"
                  ? "bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Notebook
            </button>

            <button
              id="nav-tab-calendar"
              onClick={() => setActiveTab("calendar")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Calendar
            </button>

            <button
              id="nav-tab-advisor"
              onClick={() => setActiveTab("advisor")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "advisor"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" /> Assistant
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "settings"
                  ? "bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Settings
            </button>
          </nav>

          {/* Right: Security info, notification bells, settings and Logout */}
          <div className="flex items-center gap-3">
            
            {/* Zero-Knowledge PIN info */}
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-lg text-[10px] font-mono">
              <Lock className="w-3 h-3" />
              <span>AES: {encryptionPin}</span>
            </div>

            {/* Theme switcher */}
            <button
              id="btn-theme-switcher"
              onClick={toggleTheme}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-indigo-300 rounded-lg border border-slate-200/50 dark:border-slate-700 cursor-pointer"
              title="Symmetric Shade"
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="btn-notifications-trigger"
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-indigo-300 rounded-lg border border-slate-200/50 dark:border-slate-700 cursor-pointer relative"
                title="System Warnings"
              >
                <Bell className="w-3.5 h-3.5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Warnings dropdown list popup */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-3 w-80 modern-dropdown border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none z-50 p-4 animate-scale-up max-h-[380px] overflow-y-auto custom-scrollbar-element">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Live Workspace Reminders</h4>
                      <span className="text-[9px] font-mono text-slate-400 block tracking-wider uppercase mt-0.5">Firebase Alerts Sync</span>
                    </div>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <CheckCheck className="w-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  {/* Desktop Alerts Action Bar */}
                  <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-500">Desktop Alerts</span>
                    {notificationPermission === "granted" ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 font-mono text-[10px]">
                        ● Enabled
                      </span>
                    ) : notificationPermission === "denied" ? (
                      <span className="text-rose-500 font-bold flex items-center gap-1 font-mono text-[10px]">
                        ● Blocked
                      </span>
                    ) : (
                      <button
                        onClick={requestDesktopPermission}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded text-[10px] shadow-xs cursor-pointer"
                      >
                        🔔 Enable
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 mt-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                        <BellOff className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-300" />
                        <p>No new notifications.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border text-[11px] relative transition-colors ${
                            n.read
                              ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-100/50 dark:border-slate-800/50 text-slate-500"
                              : "bg-indigo-50/5 dark:bg-indigo-950/5 border-indigo-100/30 dark:border-indigo-900/40 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`font-mono text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md ${
                              n.type === "task" 
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" 
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450"
                            }`}>
                              {n.type}
                            </span>
                            <div className="flex items-center gap-1">
                              {!n.read && (
                                <button
                                  onClick={() => handleMarkAsRead(n.id)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                  title="Mark read"
                                >
                                  <CheckCheck className="w-3" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(n.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Delete alert"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <h5 className="font-bold mt-1.5 leading-snug">{n.title}</h5>
                          <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">{n.message}</p>
                          <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 mt-2 block text-right">{n.date}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout trigger button */}
            <button
              id="btn-logout-trigger"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>

          </div>

        </div>
      </header>

      {/* CORE FRAME FOR ACTIVE VIEWS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6" id="main-viewframe">
        
        {activeTab === "dashboard" && (
          <FinanceDashboard 
            expenses={expenses}
            setExpenses={setExpensesWithSync}
            budgets={budgets}
            setBudgets={setBudgetsWithSync}
            savingsGoals={savingsGoals}
            setSavingsGoals={setSavingsGoalsWithSync}
            monthlyIncome={monthlyIncome}
            setMonthlyIncome={handleSetMonthlyIncome}
            tags={tags}
            setTags={setTags}
            addSystemEvent={addSystemEventWithSync}
          />
        )}

        {activeTab === "notes" && (
          <NotionNotes 
            notes={notes}
            setNotes={setNotesWithSync}
            tags={tags}
            currentSelectedNoteId={currentSelectedNoteId}
            setCurrentSelectedNoteId={setCurrentSelectedNoteId}
          />
        )}

        {activeTab === "calendar" && (
          <TasksAndCalendar 
            tasks={tasks}
            setTasks={setTasksWithSync}
            events={events}
            setEvents={setEventsWithSync}
            addSystemEvent={addSystemEventWithSync}
          />
        )}

        {activeTab === "advisor" && (
          <AiAssistant 
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            expenses={expenses}
            budgets={budgets}
            savingsGoals={savingsGoals}
            monthlyIncome={monthlyIncome}
            tasks={tasks}
            events={events}
          />
        )}

        {activeTab === "settings" && (
          <ProfileSettings 
            user={user}
            encryptionPin={encryptionPin}
            theme={theme}
            toggleTheme={toggleTheme}
            notificationPermission={notificationPermission}
            requestDesktopPermission={requestDesktopPermission}
            onTriggerWipeDatabase={() => setShowClearConfirm(true)}
          />
        )}

      </main>

      {/* FOOTER DESCRIPTOR BANNER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-5 px-6 mt-12 text-center" id="app-bottom-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
          <p className="font-medium text-slate-500 dark:text-slate-400">
            © 2026 PocketBook AI Advisor Premium. Powered by secure server-side Gemini 3.5 models. Developed by <a href="https://github.com/devtmj1123/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">TMJ</a>.
          </p>
          <div className="flex gap-4 font-mono uppercase tracking-widest text-[9px] font-bold">
            <span className="text-emerald-600 dark:text-emerald-400">● Cloud Data Node Connected</span>
          </div>
        </div>
      </footer>

      {/* DB CLEARANCE CONFIRMATION DIALOG */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" id="db-clearall-dialog">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-xl animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
              <span className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-slate-100">Purge Real-Time Cloud Database?</h3>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-0.5">Sensitive Administrative Operation</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              This will permanently delete all transactions, category budgets, savings goals, notebook pages, calendar events, and tasks created under your user account in the real-time Firebase Firestore database. This action is irreversible.
            </p>

            {isWiping ? (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{wipeStatusMessage}</span>
              </div>
            ) : (
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold font-mono text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAllData}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold font-mono text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-200 dark:shadow-none"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eviscerate All Data
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
