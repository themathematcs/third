import { useState, useEffect, FormEvent } from "react";
import { Trade, WeeklyReview } from "./types";
import TradeTable from "./components/TradeTable";
import WeeklyReviewSection from "./components/WeeklyReviewSection";
import Dashboard from "./components/Dashboard";
import BacktestSection from "./components/BacktestSection";
import { BookOpen, Calendar, HelpCircle, LayoutDashboard, Sparkles, RefreshCcw, Trash2, Github, Flame } from "lucide-react";

// Pre-seeded trades for premium native preview
const INITIAL_TRADES: Trade[] = [
  {
    id: "t1",
    date: "2206-06-01",
    week: "Week 1",
    asset: "GBPUSD",
    direction: "LONG",
    entryPrice: 1.2650,
    exitPrice: 1.2720,
    pnl: 350.00,
    outcome: "WIN",
    comments: "Perfect break-and-retest play on the 1H support level. Stuck strictly to my rule to wait for candle closure before committing capital. What I can do better: Take partial profit at 1.5R, then trailing remainder. Still, great execution.",
  },
  {
    id: "t2",
    date: "2206-06-03",
    week: "Week 1",
    asset: "BTCUSDT",
    direction: "SHORT",
    entryPrice: 67200.00,
    exitPrice: 67950.00,
    pnl: -220.00,
    outcome: "LOSS",
    comments: "Tried to catch an early top rejection near daily orderblock. Squeezed cleanly on heavy buyers momentum during Asia session. What went well: Respected my initial stop loss to the dollar. What I can do better: Never short the first test of high timeframes with positive volume delta.",
  },
  {
    id: "t3",
    date: "2206-06-05",
    week: "Week 1",
    asset: "EURUSD",
    direction: "LONG",
    entryPrice: 1.0810,
    exitPrice: 1.0810,
    pnl: 0.00,
    outcome: "BREAKEVEN",
    comments: "Price went 1R in favor, then momentum slowed. Slipped stop-loss to entry to eliminate risk as per plan. Got wicked back out. Perfect rule adherence. No regrets.",
  },
  {
    id: "t4",
    date: "2206-06-08",
    week: "Week 2",
    asset: "NVDA",
    direction: "LONG",
    entryPrice: 124.50,
    exitPrice: 129.20,
    pnl: 470.00,
    outcome: "WIN",
    comments: "Momentum breakout on post-earnings stock volume. Highly valid play backed by heavy volume. What I did well: Entered directly on breakout level trigger. What I can do better: Position size could have been larger given high setup score.",
  },
  {
    id: "t5",
    date: "2206-06-10",
    week: "Week 2",
    asset: "ETHUSDT",
    direction: "SHORT",
    entryPrice: 3520.00,
    exitPrice: 3565.00,
    pnl: -180.00,
    outcome: "LOSS",
    comments: "Short entry triggered on suspect engulfing candle on 15M. Got greedy and traded counter to parent order flow. What I did badly: Broke rules by ignoring high timeframe trend. What I can do better: Put a sticky rule note under my screen: ONLY TREND ALIGNED SEEDS.",
  },
];

// Initial reviews to match pre-seeded trades
const INITIAL_REVIEWS: WeeklyReview[] = [
  {
    week: "Week 1",
    winningTradeTakeAgain: "YES",
    winningYesExecution: "Yes, waited for candle close and entered exactly. Kept stop loss tight and rode the trend.",
    winningYesManagement: "Could have trailed stops more aggressively or done partial take profits at key targets.",
    winningYesRepeat: "I will set local price alerts at major high timeframe support levels.",
    winningNoDeviation: "",
    winningNoAvoided: "",
    winningNoIncorrect: "",
    
    losingTradeTakeAgain: "NO",
    losingYesAvoidLoss: "",
    losingYesWellDone: "",
    losingYesEmotions: "",
    losingNoDeviation: "Shorted the initial peak test. Ignored volume metrics.",
    losingNoWarning: "Very positive volume delta and high momentum candle expansions on Nasdaq.",
    losingNoImpact: "Felt slightly disappointed, but respected the stop. No emotional revenge plays afterward.",
    
    overallMissedTrade: "Missed long setups on EURUSD on Wednesday morning because I was over-analyzing smaller pairs.",
    overallDifferentThisWeek: "I respected position size limits perfectly, which drastically improved stress.",
    overallBetterExecution: "Executing became easier as soon as size limits were checked.",
    overallMindsetImpact: "Felt highly objective on Thursday despite early drawdowns.",
    overallNextWeekActions: "Confirm parent trend alignment in post-market review before next setups.",
    
    strengthCause: "Maintaining pre-market preparation and morning walk routines.",
    strengthPurpose: "Clears mind fog and guarantees I don't chase assets on open.",
    strengthAction: "Will repeat identical morning process every trading day.",
    
    mistakeCause: "Late counter-trend scalps when bored.",
    mistakePurpose: "Avoids slow account bleed on invalid market setups.",
    mistakeAction: "Turn on terminal security lock after pre-planned trades execute.",
    
    isCompleted: true,
    updatedAt: new Date().toISOString(),
  }
];

export default function App() {
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem("trading_journal_trades");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_TRADES;
      }
    }
    return INITIAL_TRADES;
  });

  const [reviews, setReviews] = useState<WeeklyReview[]>(() => {
    const saved = localStorage.getItem("trading_journal_reviews");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_REVIEWS;
      }
    }
    return INITIAL_REVIEWS;
  });

  const [allWeeks, setAllWeeks] = useState<string[]>(() => {
    const saved = localStorage.getItem("trading_journal_weeks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return ["Week 1", "Week 2", "Week 3", "Week 4"];
      }
    }
    return ["Week 1", "Week 2", "Week 3", "Week 4"];
  });

  const [selectedWeek, setSelectedWeek] = useState<string>("All Weeks");
  const [activeTab, setActiveTab] = useState<"logs" | "reviews" | "dashboard" | "backtest">("logs");
  const [weekInput, setWeekInput] = useState("");
  const [showAddWeek, setShowAddWeek] = useState(false);

  // Sync to outer storage
  useEffect(() => {
    localStorage.setItem("trading_journal_trades", JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem("trading_journal_reviews", JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem("trading_journal_weeks", JSON.stringify(allWeeks));
  }, [allWeeks]);

  // Actions
  const handleAddTrade = (newTrade: Trade) => {
    setTrades((prev) => [newTrade, ...prev]);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    setTrades((prev) => prev.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
  };

  const handleDeleteTrade = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveReview = (newReview: WeeklyReview) => {
    setReviews((prev) => {
      const existingIdx = prev.findIndex((r) => r.week === newReview.week);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newReview;
        return copy;
      }
      return [...prev, newReview];
    });
  };

  const handleCreateWeek = (e: FormEvent) => {
    e.preventDefault();
    const formattedWeek = weekInput.trim();
    if (formattedWeek && !allWeeks.includes(formattedWeek)) {
      setAllWeeks((prev) => [...prev, formattedWeek]);
      setSelectedWeek(formattedWeek);
      setWeekInput("");
      setShowAddWeek(false);
    }
  };

  const handleResetData = () => {
    if (confirm("Reset current records back to sample template levels? This restores pre-populated statistics.")) {
      setTrades(INITIAL_TRADES);
      setReviews(INITIAL_REVIEWS);
      setAllWeeks(["Week 1", "Week 2", "Week 3", "Week 4"]);
      setSelectedWeek("All Weeks");
      setActiveTab("logs");
    }
  };

  const handleClearEverything = () => {
    if (confirm("WARNING: This will permanently wipe all your trading entries and weekly reflections! Are you sure?")) {
      setTrades([]);
      setReviews([]);
      setAllWeeks(["Week 1", "Week 2", "Week 3", "Week 4"]);
      setSelectedWeek("All Weeks");
      setActiveTab("logs");
    }
  };

  // Get active review for selected week (falling back to Week 1 if All Weeks is selected in the review tab)
  const activeReviewWeek = selectedWeek === "All Weeks" ? (allWeeks[0] || "Week 1") : selectedWeek;
  const currentWeekReview = reviews.find((r) => r.week === activeReviewWeek);

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50/50 text-slate-800 antialiased font-sans flex flex-col justify-between">
      
      {/* 1. Elegant Minimalist Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                TradeCraft Journal
                <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Metrics & Psychological Review Log</p>
            </div>
          </div>

          {/* Dynamic Tab Selector Tabs */}
          <nav className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40">
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "logs"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Logs & Tables
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "reviews"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Weekly Review
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "dashboard"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("backtest")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "backtest"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Backtest Lab
            </button>
          </nav>
          
          {/* Quick Stats Helper */}
          <div className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => setShowAddWeek(true)}
              className="text-xs bg-slate-50 text-slate-600 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
            >
              + Create Week
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel Frame */}
      <main className="max-w-5xl w-full mx-auto px-4 py-8 flex-grow">
        
        {/* Dynamic New Week overlay inline card */}
        {showAddWeek && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 max-w-sm w-full shadow-2xl animate-scaleIn">
              <h4 className="font-display font-bold text-slate-800 text-base mb-1">Create Trading Group Week</h4>
              <p className="text-xs text-slate-400 mb-4">Set dynamic periods (e.g. Week 5, July Week 1, etc.) to categorize logs.</p>
              
              <form onSubmit={handleCreateWeek} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="e.g., Week 5"
                  value={weekInput}
                  onChange={(e) => setWeekInput(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600"
                />
                <div className="flex gap-2 text-sm font-semibold justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddWeek(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition"
                  >
                    Confirm Week
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Context router */}
        {activeTab === "logs" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Context Notice */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-slate-800">Review & Journal Trades</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Log and monitor your trades, upload overall execution outcomes, and review lessons learned.
                  </p>
                </div>
                
                {/* Visual active filter banner */}
                <div className="bg-blue-50 text-blue-700 text-xs px-3.5 py-1.5 rounded-xl font-semibold border border-blue-100">
                  Filtering Period: <span className="font-bold">{selectedWeek}</span>
                </div>
              </div>
            </div>

            <TradeTable
              trades={trades}
              onAddTrade={handleAddTrade}
              onUpdateTrade={handleUpdateTrade}
              onDeleteTrade={handleDeleteTrade}
              selectedWeek={selectedWeek}
              setSelectedWeek={setSelectedWeek}
              allWeeks={allWeeks}
            />
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-display font-semibold text-slate-800">Focus Reflection Period</h3>
                <p className="text-xs text-slate-400 mt-0.5">Choose which active trading period review to run or view as read-only.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase">Active Week:</span>
                <select
                  value={activeReviewWeek}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setSelectedWeek(chosen);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  {allWeeks.map((wk) => (
                    <option key={wk} value={wk}>
                      {wk}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAddWeek(true)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold py-2 px-3.5 rounded-xl transition"
                >
                  + New
                </button>
              </div>
            </div>

            <WeeklyReviewSection
              week={activeReviewWeek}
              savedReview={currentWeekReview}
              onSave={handleSaveReview}
            />
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top row description */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-display font-extrabold text-slate-800">Monthly Trade Statistics</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Overall metric parameters, profit factors, winning metrics, and monthly returns calculated in real-time.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetData}
                  className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50/70 hover:bg-blue-50 px-3.5 py-2 rounded-xl transition border border-blue-100 font-semibold"
                  title="Restore the default sample data"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Restore Demo
                </button>
                <button
                  onClick={handleClearEverything}
                  className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50/70 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition border border-rose-100 font-semibold"
                  title="Wipe out everything and start fresh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Journal
                </button>
              </div>
            </div>

            <Dashboard trades={trades} reviews={reviews} />
          </div>
        )}

        {activeTab === "backtest" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top header introduction */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-slate-800 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-blue-600" />
                    Backtest Calibration & Practices
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Log and examine 10 model drill structures daily. Skip a day or fail a quota, and the penalty target doubles sequentially tomorrow!
                  </p>
                </div>
                <div className="bg-blue-50 text-blue-700 text-xs px-3.5 py-1.5 rounded-xl font-semibold border border-blue-100 uppercase tracking-wider font-mono">
                  Quota system: 10/day
                </div>
              </div>
            </div>

            <BacktestSection />
          </div>
        )}
      </main>

      {/* 4. Humble professional footer, no slop margin clutter */}
      <footer className="border-t border-slate-100 bg-white py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} TradeCraft. All trade data persists securely in local storage sandbox.</p>
          <div className="flex items-center gap-4">
            <span>Simple. Distraction-Free.</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Optimized Execution</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
