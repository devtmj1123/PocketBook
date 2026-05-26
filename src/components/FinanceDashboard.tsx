import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  DollarSign, 
  Sliders, 
  Tag, 
  ChevronRight, 
  AlertTriangle, 
  PiggyBank, 
  Search, 
  Sparkles,
  CalendarDays,
  Menu,
  FileText,
  X
} from "lucide-react";
import { Transaction, Budget, SavingsGoal, CustomTag } from "../types";
import CustomSelect from "./CustomSelect";

interface FinanceDashboardProps {
  expenses: Transaction[];
  setExpenses: React.Dispatch<React.SetStateAction<Transaction[]>>;
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  savingsGoals: SavingsGoal[];
  setSavingsGoals: React.Dispatch<React.SetStateAction<SavingsGoal[]>>;
  monthlyIncome: number;
  setMonthlyIncome: (income: number) => void;
  tags: CustomTag[];
  setTags: React.Dispatch<React.SetStateAction<CustomTag[]>>;
  addSystemEvent: (title: string, amount: number, type: "income" | "expense" | "reminder") => void;
}

export default function FinanceDashboard({
  expenses,
  setExpenses,
  budgets,
  setBudgets,
  savingsGoals,
  setSavingsGoals,
  monthlyIncome,
  setMonthlyIncome,
  tags,
  setTags,
  addSystemEvent,
}: FinanceDashboardProps) {
  // Navigation & visual controllers
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Budget threshold warning popup trigger state
  const [budgetAlert, setBudgetAlert] = useState<{
    category: string;
    limit: number;
    amountAdded: number;
    currentSpent: number;
    exceededBy: number;
    expenseTitle: string;
  } | null>(null);

  // Creation forms state
  const [newTx, setNewTx] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
    tag: "",
    notes: "",
  });

  const [newBudget, setNewBudget] = useState({
    category: "Leisure",
    limit: "",
  });

  const [newGoal, setNewGoal] = useState({
    name: "",
    target: "",
    current: "",
    targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: "",
  });

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("bg-blue-100 text-blue-800");

  // Dialog / Edit modes
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [showIncomeEdit, setShowIncomeEdit] = useState(false);
  const [incomeInput, setIncomeInput] = useState(monthlyIncome.toString());

  // Static common financial categories
  const categories = [
    "Food", 
    "Utilities", 
    "Housing", 
    "Leisure", 
    "Transportation", 
    "Subscription", 
    "Healthcare", 
    "Education", 
    "Miscellaneous"
  ];

  // Visual custom colors for tags
  const tagColors = [
    { name: "Slate", class: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300" },
    { name: "Red", class: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300" },
    { name: "Orange", class: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
    { name: "Green", class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { name: "Blue", class: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300" },
    { name: "Violet", class: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300" },
  ];

  // Financial aggregates
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, tx) => sum + tx.amount, 0);
  }, [expenses]);

  const activeBudgetsMap = useMemo(() => {
    // calculate actual spent per category
    const map: { [key: string]: number } = {};
    expenses.forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    });
    return map;
  }, [expenses]);

  const totalBudgetsLimit = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.limit, 0);
  }, [budgets]);

  const totalSavedGoals = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + g.current, 0);
  }, [savingsGoals]);

  const remainingIncome = monthlyIncome - totalExpenses;

  const savingsRate = useMemo(() => {
    if (monthlyIncome <= 0) return 0;
    // Calculate simulated savings (Monthly Income - Expenses) as a rate, clamped to 100
    const rate = ((monthlyIncome - totalExpenses) / monthlyIncome) * 100;
    return Math.max(0, parseFloat(rate.toFixed(1)));
  }, [monthlyIncome, totalExpenses]);

  // Handle Transactions
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newTx.amount);
    if (!newTx.title || isNaN(amountVal) || amountVal <= 0) return;

    const added: Transaction = {
      id: "tx_" + Date.now(),
      title: newTx.title,
      amount: amountVal,
      category: newTx.category,
      date: newTx.date,
      tag: newTx.tag || "None",
      notes: newTx.notes,
    };

    setExpenses((prev) => [added, ...prev]);

    // Check if newly added transaction pushes corresponding category budget over limit
    const relevantBudget = budgets.find((b) => b.category === added.category);
    if (relevantBudget) {
      const oldSpent = relevantBudget.spent;
      const newSpent = oldSpent + added.amount;
      if (newSpent > relevantBudget.limit) {
        setBudgetAlert({
          category: added.category,
          limit: relevantBudget.limit,
          amountAdded: added.amount,
          currentSpent: newSpent,
          exceededBy: newSpent - relevantBudget.limit,
          expenseTitle: added.title,
        });
      }
    }

    // Update corresponding budget allocation spent
    setBudgets((prev) => 
      prev.map((b) => {
        if (b.category === added.category) {
          return { ...b, spent: b.spent + added.amount };
        }
        return b;
      })
    );

    // Write a calendar reminder matching the event automatically
    addSystemEvent(
      `Exp: ${added.title} (${added.category})`, 
      added.amount, 
      "expense"
    );

    // Reset Form
    setNewTx({
      title: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().split("T")[0],
      tag: "",
      notes: "",
    });
    setShowAddTx(false);
  };

  const handleDeleteExpense = (id: string, category: string, amount: number) => {
    setExpenses((prev) => prev.filter((tx) => tx.id !== id));
    // refund category budget spent tracker
    setBudgets((prev) => 
      prev.map((b) => {
        if (b.category === category) {
          return { ...b, spent: Math.max(0, b.spent - amount) };
        }
        return b;
      })
    );
  };

  const handleExportCSV = () => {
    const escapeCsv = (str: string) => {
      const escaped = str.replace(/"/g, '""');
      return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')
        ? `"${escaped}"`
        : escaped;
    };

    const headers = ["ID", "Title / Item", "Amount ($)", "Category", "Date", "Tag Mapping", "Notebook Attachment"];
    const rows = filteredExpenses.map((tx) => [
      tx.id,
      tx.title,
      tx.amount.toFixed(2),
      tx.category,
      tx.date,
      tx.tag,
      tx.notes || ""
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(String(cell))).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pocketbook_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Income Change
  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(incomeInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setMonthlyIncome(parsed);
      setShowIncomeEdit(false);
    }
  };

  // Handle Budgets
  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limitVal = parseFloat(newBudget.limit);
    if (isNaN(limitVal) || limitVal <= 0) return;

    // Check if category budget exists
    const exists = budgets.find((b) => b.category === newBudget.category);
    if (exists) {
      setBudgets((prev) => 
        prev.map((b) => 
          b.category === newBudget.category ? { ...b, limit: b.limit + limitVal } : b
        )
      );
    } else {
      const added: Budget = {
        id: "b_" + Date.now(),
        category: newBudget.category,
        limit: limitVal,
        spent: activeBudgetsMap[newBudget.category] || 0,
      };
      setBudgets((prev) => [...prev, added]);
    }

    setNewBudget({ category: "Leisure", limit: "" });
    setShowAddBudget(false);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  // Handle Savings Goals
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(newGoal.target);
    const currVal = parseFloat(newGoal.current || "0");
    if (!newGoal.name || isNaN(targetVal) || targetVal <= 0) return;

    const added: SavingsGoal = {
      id: "g_" + Date.now(),
      name: newGoal.name,
      target: targetVal,
      current: isNaN(currVal) ? 0 : currVal,
      targetDate: newGoal.targetDate,
      description: newGoal.description,
    };

    setSavingsGoals((prev) => [...prev, added]);
    setNewGoal({
      name: "",
      target: "",
      current: "",
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      description: "",
    });
    setShowAddGoal(false);

    // Auto add visual calendar update
    addSystemEvent(
      `Goal target: ${added.name}`, 
      added.target - added.current, 
      "reminder"
    );
  };

  const handleAdjustGoalFunds = (id: string, changeAmount: number) => {
    if (isNaN(changeAmount)) return;
    setSavingsGoals((prev) => 
      prev.map((g) => {
        if (g.id === id) {
          const newVal = Math.max(0, Math.min(g.target, g.current + changeAmount));
          return { ...g, current: newVal };
        }
        return g;
      })
    );
  };

  const handleDeleteGoal = (id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // Manage tags
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const exists = tags.find((t) => t.name.toLowerCase() === newTagName.toLowerCase());
    if (exists) return;

    const added: CustomTag = {
      id: "tag_" + Date.now(),
      name: newTagName.trim(),
      color: newTagColor,
    };
    setTags((prev) => [...prev, added]);
    setNewTagName("");
    setShowAddTag(false);
  };

  const handleDeleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  // Filtering Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((tx) => {
      const matchSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchTag = selectedTagFilter === "all" || tx.tag === selectedTagFilter;
      const matchCategory = selectedCategoryFilter === "all" || tx.category === selectedCategoryFilter;
      
      return matchSearch && matchTag && matchCategory;
    });
  }, [expenses, searchTerm, selectedTagFilter, selectedCategoryFilter]);

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-wrapper">
      
      {/* HEADER HERO METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="metric-grid">
        
        {/* Income Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 hover:shadow-sm transition-all" id="metric-income-card">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">Monthly Income</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">$ {monthlyIncome.toLocaleString()}</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">Primary budget fuel source</p>
          </div>
          <button 
            id="btn-edit-income"
            onClick={() => {
              setIncomeInput(monthlyIncome.toString());
              setShowIncomeEdit(!showIncomeEdit);
            }}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-mono font-medium self-start flex items-center gap-1 mt-2.5"
          >
            <Sliders className="w-3.5 h-3.5" /> Configure Income
          </button>

          {showIncomeEdit && (
            <form onSubmit={handleSaveIncome} className="mt-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
              <label className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 block">SET MONTHLY NET INCOME</label>
              <div className="flex gap-1.5">
                <input 
                  type="number" 
                  value={incomeInput} 
                  onChange={(e) => setIncomeInput(e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md font-semibold"
                  placeholder="e.g. 5000"
                />
                <button type="submit" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-[11px] px-3.5 rounded-md font-mono hover:bg-slate-800 dark:hover:bg-slate-200 transition-all font-bold">
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Expenses Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-xs flex flex-col justify-between hover:border-rose-500/30 dark:hover:border-rose-500/30 hover:bg-rose-50/10 dark:hover:bg-rose-950/10 hover:shadow-sm transition-all" id="metric-expenses-card">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Recorded Spent</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">$ {totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">For current payroll cycle</p>
          </div>
          <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-2">
            {totalExpenses > monthlyIncome ? (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> Deficit: -${Math.abs(monthlyIncome - totalExpenses).toLocaleString()}
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                Safe reserve: ${(monthlyIncome - totalExpenses).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Savings Rate Gauge */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-xs flex items-center gap-4 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 hover:shadow-sm transition-all" id="metric-savingsRate-card">
          <div className="relative w-16 h-16 flex-shrink-0">
            {/* SVG Arc Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-800 stroke-current"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600 dark:text-indigo-400 stroke-current"
                strokeDasharray={`${savingsRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{savingsRate}%</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Savings Rate</span>
            <span className="text-medium font-semibold text-slate-800 dark:text-slate-200">
              {savingsRate >= 30 ? "Superb Saver" : savingsRate > 10 ? "Moderate Saver" : "Boost savings"}
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Recommended target is 20%+</p>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/85 shadow-xs flex flex-col justify-between hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 hover:shadow-sm transition-all" id="metric-goals-card">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Goal Reserve</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">$ {totalSavedGoals.toLocaleString()}</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{savingsGoals.length} Active savings targets</p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, (savingsGoals.reduce((sum, g) => sum + g.current, 0) / (savingsGoals.reduce((sum, g) => sum + g.target, 0) || 1)) * 100)}%` 
              }}
            />
          </div>
        </div>

      </div>

      {/* CORE WORKSPACE: Left Column (Expenses & Ledger), Right Column (Budgets & Savings) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="financial-workspace">
        
        {/* LEFT COLUMN: TRANSACTIONS & MANAGER (Takes 2 span on desktop) */}
        <div className="lg:col-span-2 space-y-6" id="tx-column">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs p-6" id="tx-registry-box">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-5 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Transactional Ledger</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Review, filter, and document every monthly financial transaction</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-export-csv"
                  onClick={handleExportCSV}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all font-semibold cursor-pointer border border-slate-200/40 dark:border-slate-700"
                  title="Export filtered transactions directly to CSV"
                >
                  <FileText className="w-3.5 h-3.5" /> Export Filtered CSV
                </button>
                <button
                  id="btn-add-expense-modal"
                  onClick={() => setShowAddTx(!showAddTx)}
                  className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all font-medium self-start shadow-xs shadow-slate-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Transaction
                </button>
              </div>
            </div>

            {/* QUICK FORM: ADD EXPENSE */}
            {showAddTx && (
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 mb-6 animate-fade-in" id="add-tx-form-block">
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Record Income or Expense</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowAddTx(false)}
                      className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-mono"
                    >
                      Hide
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Title / Description</label>
                      <input 
                        type="text" 
                        required
                        value={newTx.title} 
                        onChange={(e) => setNewTx({ ...newTx, title: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Grocery Restock, Rent, Netflix"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Amount ($)</label>
                      <input 
                        type="number"
                        step="0.01"
                        required
                        value={newTx.amount} 
                        onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl font-mono font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Category</label>
                      <CustomSelect
                        value={newTx.category}
                        onChange={(val) => setNewTx({ ...newTx, category: val })}
                        options={categories.map((c) => ({ value: c, label: c }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Date</label>
                      <input 
                        type="date" 
                        required
                        value={newTx.date} 
                        onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                        className="w-full text-xs p-2.5 opacity-90 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl font-mono outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-slate-600 dark:text-slate-400 block font-medium">Custom Tag</label>
                        <button
                          type="button"
                          onClick={() => setShowAddTag(true)}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono hover:underline cursor-pointer"
                        >
                          + New Tag
                        </button>
                      </div>
                      <CustomSelect
                        value={newTx.tag}
                        onChange={(val) => setNewTx({ ...newTx, tag: val })}
                        options={[{ value: "", label: "No Tag" }, ...tags.map((t) => ({ value: t.name, label: t.name }))]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Notebook inline notes / Rich descriptions</label>
                    <textarea
                      value={newTx.notes}
                      onChange={(e) => setNewTx({ ...newTx, notes: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl h-16 outline-none"
                      placeholder="Add detailed markdown, recipe URLs, billing accounts, itemized price details, or inline specs..."
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white dark:bg-indigo-500 text-xs font-semibold py-2.5 rounded-xl block hover:bg-indigo-700 transition-all font-mono cursor-pointer"
                  >
                    Commit Transaction record
                  </button>
                </form>
              </div>
            )}

            {/* SEARCH AND FILTERS TOOL BAR */}
            <div className="flex flex-col sm:flex-row gap-2 pb-5 mb-5 border-b border-slate-50 dark:border-slate-800" id="filters-toolbar">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 w-4 h-4" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 dark:text-white transition-all"
                  placeholder="Search ledger by name, notes, tag, category..."
                />
              </div>

              {/* Tag dropdown filter */}
              <div className="flex gap-2">
                <CustomSelect
                  value={selectedTagFilter}
                  onChange={(val) => setSelectedTagFilter(val)}
                  options={[{ value: "all", label: "Tags: All" }, ...tags.map((t) => ({ value: t.name, label: t.name }))]}
                  className="shrink-0 min-w-[110px]"
                />

                <CustomSelect
                  value={selectedCategoryFilter}
                  onChange={(val) => setSelectedCategoryFilter(val)}
                  options={[{ value: "all", label: "Category: All" }, ...categories.map((c) => ({ value: c, label: c }))]}
                  className="shrink-0 min-w-[130px]"
                />
              </div>
            </div>

            {/* TRANSACTIONS TABLE / LEDGER GRID */}
            {filteredExpenses.length === 0 ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                {searchTerm || selectedTagFilter !== "all" || selectedCategoryFilter !== "all" ? (
                  <p>No transactions match your active ledger filters.</p>
                ) : (
                  <div>
                    <PiggyBank className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p>Financial ledger is empty.</p>
                    <button 
                      onClick={() => setShowAddTx(true)}
                      className="text-indigo-600 dark:text-indigo-400 underline font-semibold mt-1 block h-fit text-center mx-auto cursor-pointer"
                    >
                      Record your first checkout expense!
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1" id="ledger-list-scroll">
                {filteredExpenses.map((tx) => {
                  // Find tag visual representation
                  const activeTag = tags.find((t) => t.name === tx.tag);
                  
                  return (
                    <div 
                      key={tx.id} 
                      className="group border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 p-4 rounded-xl flex items-start gap-3.5 transition-all"
                    >
                      {/* Icon Indicator based on category */}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-600 dark:text-slate-400 flex-shrink-0">
                        <DollarSign className="w-4 h-4" />
                      </div>

                      {/* Info & Notes */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-medium text-slate-900 dark:text-slate-100 text-sm block truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {tx.title}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {/* category indicator */}
                              <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">
                                {tx.category}
                              </span>
                              {/* date */}
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{tx.date}</span>
                              {/* custom tags */}
                              {activeTag && (
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-medium ${activeTag.color}`}>
                                  #{activeTag.name}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                              ${tx.amount.toFixed(2)}
                            </span>
                            <button
                              id={`delete-tx-${tx.id}`}
                              onClick={() => handleDeleteExpense(tx.id, tx.category, tx.amount)}
                              className="text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 group-hover:opacity-100 opacity-0 md:opacity-0 transition-opacity cursor-pointer animate-fade-in"
                              title="Delete transaction record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Notion-style rich descriptor */}
                        {tx.notes && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 border-l-2 border-slate-200 dark:border-slate-800 font-sans leading-relaxed whitespace-pre-wrap rounded-r-md">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-wider block font-bold uppercase mb-0.5">Notebook Attachment:</span>
                            {tx.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* TAGS MANAGER AREA */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs p-6" id="tags-manager-box">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100">Custom Tags Organizer</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Manage tags matching calendar events, notes, and budgets</p>
              </div>
              <button
                id="btn-trigger-add-tag"
                onClick={() => setShowAddTag(!showAddTag)}
                className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Create Tag
              </button>
            </div>

            {showAddTag && (
              <form onSubmit={handleAddTag} className="bg-slate-50 dark:bg-slate-950 p-4 border border-indigo-100 dark:border-indigo-900/40 border-dashed rounded-xl space-y-3 mb-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Tag Name</label>
                    <input 
                      type="text" 
                      required
                      value={newTagName} 
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg outline-none"
                      placeholder="e.g. Essential, Birthday, WorkRelated"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Style Shade</label>
                    <CustomSelect
                      value={newTagColor}
                      onChange={(val) => setNewTagColor(val)}
                      options={tagColors.map((tc) => ({ value: tc.class, label: tc.name }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowAddTag(false)}
                    className="text-xs font-mono text-slate-500 dark:text-slate-400 px-3 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="text-xs font-semibold px-4 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                  >
                    Generate Tag
                  </button>
                </div>
              </form>
            )}

            <div className="flex gap-2 flex-wrap">
              {tags.map((t) => (
                <div 
                  key={t.id} 
                  className={`inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-800/80 ${t.color}`}
                >
                  #{t.name}
                  {t.name !== "Groceries" && t.name !== "Luxuries" && (
                    <button 
                      onClick={() => handleDeleteTag(t.id)}
                      className="ml-1 text-[10px] hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete tag"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: BUDGETS & SAVINGS GOALS (Takes 1 span on desktop) */}
        <div className="space-y-6" id="budget-column">
          
          {/* CATEGORY BUDGETS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs p-6" id="budgets-card">
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Allowances</span>
                <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100">Custom Category Budgets</h3>
              </div>
              <button
                id="btn-trigger-add-budget"
                onClick={() => setShowAddBudget(!showAddBudget)}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all rounded-lg cursor-pointer"
                title="Create category limit"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* ADD BUDGET BOX */}
            {showAddBudget && (
              <form onSubmit={handleAddBudget} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3 mb-4 animate-fade-in">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Category</label>
                  <CustomSelect
                    value={newBudget.category}
                    onChange={(val) => setNewBudget({ ...newBudget, category: val })}
                    options={categories.map((c) => ({ value: c, label: c }))}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Monthly Threshold ($)</label>
                  <input 
                    type="number"
                    required
                    value={newBudget.limit}
                    onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg font-mono outline-none"
                    placeholder="e.g. 500"
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddBudget(false)}
                    className="flex-1 text-xs py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 text-xs py-1.5 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold cursor-pointer"
                  >
                    Configure
                  </button>
                </div>
              </form>
            )}

            {/* BUDGET PROGRESS ITEMS */}
            <div className="space-y-4" id="budgets-progress-list">
              {budgets.map((b) => {
                const spentSum = activeBudgetsMap[b.category] || 0;
                const ratio = spentSum / b.limit;
                const percentage = Math.min(100, Math.floor(ratio * 100));
                
                // Color formatting based on spent scale
                let progressColor = "bg-indigo-600";
                
                if (ratio >= 1.0) {
                  progressColor = "bg-rose-500 animate-pulse";
                } else if (ratio >= 0.8) {
                  progressColor = "bg-amber-500";
                }

                return (
                  <div key={b.id} className="group border border-slate-50 dark:border-slate-800/60 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {b.category}
                        {ratio >= 1.0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      </div>
                      <div className="font-mono text-slate-400 dark:text-slate-500">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">${spentSum.toFixed(0)}</span>
                        <span> / ${b.limit.toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] mt-1 text-slate-400 dark:text-slate-500">
                      <span>{percentage}% exhaustion</span>
                      <button 
                        onClick={() => handleDeleteBudget(b.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-opacity font-mono cursor-pointer"
                      >
                        remove
                      </button>
                    </div>
                  </div>
                );
              })}

              {budgets.length === 0 && (
                <div className="text-center p-6 text-slate-400 dark:text-slate-500 font-mono text-xs">
                  <p>No monthly budget caps defined.</p>
                  <button 
                    onClick={() => setShowAddBudget(true)}
                    className="text-indigo-600 dark:text-indigo-400 underline text-[11px] mt-1 font-semibold cursor-pointer"
                  >
                    Define budget goal allowance!
                  </button>
                </div>
              )}
            </div>
            
          </div>

          {/* SAVINGS GOALS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs p-6" id="savings-goals-card">
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Growth Rings</span>
                <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100">Savings & Goal Targets</h3>
              </div>
              <button
                id="btn-trigger-add-goal"
                onClick={() => setShowAddGoal(!showAddGoal)}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all rounded-lg cursor-pointer"
                title="Create new savings target"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* ADD GOAL FORM */}
            {showAddGoal && (
              <form onSubmit={handleAddGoal} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3 mb-4 animate-fade-in">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Goal Descriptor</label>
                  <input 
                    type="text" 
                    required
                    value={newGoal.name} 
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg outline-none"
                    placeholder="e.g. Europe Trip, Emergency Fund"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Target ($)</label>
                    <input 
                      type="number"
                      required
                      value={newGoal.target} 
                      onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg font-mono outline-none"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Current ($)</label>
                    <input 
                      type="number"
                      value={newGoal.current} 
                      onChange={(e) => setNewGoal({ ...newGoal, current: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg font-mono outline-none"
                      placeholder="500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Target Dateline</label>
                  <input 
                    type="date" 
                    value={newGoal.targetDate} 
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Goal Comments (Notes)</label>
                  <input 
                    type="text"
                    value={newGoal.description} 
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg outline-none"
                    placeholder="Short strategy explanation..."
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddGoal(false)}
                    className="flex-1 text-xs py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 text-xs py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                  >
                    Commit Goal
                  </button>
                </div>
              </form>
            )}

            {/* LIST ACTIVE GOALS */}
            <div className="space-y-4">
              {savingsGoals.map((g) => {
                const fraction = g.current / g.target;
                const percent = Math.min(100, Math.floor(fraction * 100));
                
                return (
                  <div key={g.id} className="group border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{g.name}</h4>
                        {g.description && <p className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">{g.description}</p>}
                        <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 px-1.5 py-0.5 rounded-md mt-1 block w-fit">
                          Due: {g.targetDate}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteGoal(g.id)}
                        className="text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer"
                        title="Delete savings goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{percent}% accomplished</span>
                        <span className="dark:text-slate-400">${g.current.toLocaleString()} / ${g.target.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick allocate funds adjustments */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800" id="goal-allocate-area">
                      <button
                        onClick={() => handleAdjustGoalFunds(g.id, -50)}
                        className="flex-1 text-[10px] font-mono py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg cursor-pointer"
                      >
                        -$50
                      </button>
                      <button
                        onClick={() => handleAdjustGoalFunds(g.id, 50)}
                        className="flex-1 text-[10px] font-mono py-1 border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-800 dark:text-indigo-400 rounded-lg font-bold cursor-pointer"
                      >
                        +$50
                      </button>
                      <button
                        onClick={() => handleAdjustGoalFunds(g.id, 250)}
                        className="flex-1 text-[10px] font-mono py-1 border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-800 dark:text-emerald-400 rounded-lg font-bold cursor-pointer"
                      >
                        +$250
                      </button>
                    </div>
                  </div>
                );
              })}

              {savingsGoals.length === 0 && (
                <div className="text-center p-6 text-slate-400 font-mono text-xs">
                  <p>No active savings goals declared.</p>
                  <button 
                    onClick={() => setShowAddGoal(true)}
                    className="text-indigo-600 underline text-[11px] mt-1 font-semibold"
                  >
                    Add custom savings goal!
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
      
      {/* Visual notification modal for budget limit overflow */}
      <AnimatePresence>
        {budgetAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            id="budget-overflow-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
              className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950/60 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden space-y-5"
            >
              {/* Top ambient color bar for urgency */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 animate-pulse" />

              {/* Header section with pulsating bell alert */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-rose-500 shrink-0 relative">
                  <span className="absolute inset-0 rounded-2xl bg-rose-400/20 animate-ping" />
                  <AlertTriangle className="w-6 h-6 relative z-10" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest block">
                    Critical Alert / Budget Overflow
                  </span>
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50 font-sans leading-snug">
                    Overdraft Warning!
                  </h3>
                </div>
                <button
                  onClick={() => setBudgetAlert(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer self-start"
                  aria-label="Dismiss alert"
                  id="budget-alert-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informational description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                Logging the expense <strong className="text-slate-900 dark:text-slate-100">"{budgetAlert.expenseTitle}"</strong> for <strong className="text-rose-600 dark:text-rose-400 font-mono">${budgetAlert.amountAdded.toFixed(2)}</strong> has pushed your <strong className="text-indigo-600 dark:text-indigo-400">"{budgetAlert.category}"</strong> monthly allowance over its defined threshold.
              </p>

              {/* Progress bars / visual gauges of the budget */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3 font-sans">
                <div className="flex justify-between items-end text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">{budgetAlert.category} Monthly Cap</span>
                  <span className="font-mono font-bold text-slate-850 dark:text-slate-200">
                    ${budgetAlert.currentSpent.toFixed(2)} / <span className="text-slate-450 dark:text-slate-500">${budgetAlert.limit.toFixed(2)}</span>
                  </span>
                </div>

                <div className="relative h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {/* Under budget proportion */}
                  <div 
                    className="h-full bg-indigo-550 dark:bg-indigo-600 transition-all duration-300 rounded-l-full"
                    style={{ width: `${Math.min(100, (budgetAlert.limit / budgetAlert.currentSpent) * 100)}%` }}
                  />
                  {/* Overflow proportion in high-contrast animated red */}
                  <div 
                    className="h-full bg-rose-550 dark:bg-rose-600 flex-1 animate-pulse"
                    style={{ width: `${Math.max(0, 100 - (budgetAlert.limit / budgetAlert.currentSpent) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono leading-none pt-1">
                  <span className="text-slate-400 dark:text-slate-500">Allowed Limit</span>
                  <span className="text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1">
                    Exceeded by +${budgetAlert.exceededBy.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1 font-sans">
                <button
                  type="button"
                  onClick={() => setBudgetAlert(null)}
                  className="w-full text-center py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer outline-none"
                  id="budget-alert-dismiss"
                >
                  Close & Acknowledge
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBudgetAlert(null);
                    setNewBudget({ category: budgetAlert.category, limit: budgetAlert.limit.toString() });
                    setShowAddBudget(true);
                    
                    // Smoothly scroll elements to budget card section to guide focus
                    setTimeout(() => {
                      const element = document.getElementById("budgets-card");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }, 150);
                  }}
                  className="w-full text-center py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-rose-200/25 dark:shadow-none flex items-center justify-center gap-1.5"
                  id="budget-alert-adjust"
                >
                  Adjust Limit Cap
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
