import { useState, useEffect, ChangeEvent, DragEvent, FormEvent } from "react";
import { BacktestDrill, BacktestDayStatus } from "../types";
import { 
  Flame, 
  Target, 
  Sparkles, 
  FolderHeart, 
  Plus, 
  Trash2, 
  Eye, 
  HelpCircle, 
  BookOpen, 
  Info, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight,
  Maximize2
} from "lucide-react";

interface BacktestSectionProps {
  onAddDrillSubmit?: () => void; // Callback if needed
}

// Preset model classifications to speed up entries
const MODEL_PRESETS = [
  "Silver Bullet",
  "MSS + FVG (Market Structure Shift & Fair Value Gap)",
  "Liquidity Sweep & Rejection",
  "Order Block Mitigation",
  "High Timeframe PO3 (Power of 3)",
  "Judas Swing",
  "Daily Bias Expansion",
  "Breaker Block Entry"
];

export default function BacktestSection({}: BacktestSectionProps) {
  // Drills Local State
  const [drills, setDrills] = useState<BacktestDrill[]>(() => {
    const saved = localStorage.getItem("trading_journal_backtest_drills");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Start Date for Backtesting tracking
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    const saved = localStorage.getItem("trading_journal_backtest_start_date");
    if (saved) return saved;
    const today = new Date().toLocaleDateString('en-CA');
    localStorage.setItem("trading_journal_backtest_start_date", today);
    return today;
  });

  // Today's Date String (YYYY-MM-DD local)
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Sync backtest drills
  useEffect(() => {
    localStorage.setItem("trading_journal_backtest_drills", JSON.stringify(drills));
  }, [drills]);

  // Sync Start Date
  useEffect(() => {
    localStorage.setItem("trading_journal_backtest_start_date", startDateStr);
  }, [startDateStr]);

  // Form State
  const [formModel, setFormModel] = useState(MODEL_PRESETS[0]);
  const [customModel, setCustomModel] = useState("");
  const [ltpNote, setLtpNote] = useState("");
  const [itpNote, setItpNote] = useState("");
  const [stpNote, setStpNote] = useState("");

  // Base64 Images for Form
  const [ltpImage, setLtpImage] = useState<string | undefined>(undefined);
  const [itpImage, setItpImage] = useState<string | undefined>(undefined);
  const [stpImage, setStpImage] = useState<string | undefined>(undefined);

  // Drag-and-drop active status
  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({
    ltp: false,
    itp: false,
    stp: false
  });

  // Library Navigation State
  const [selectedLibraryDate, setSelectedLibraryDate] = useState<string>(todayStr);
  const [activeSubTab, setActiveSubTab] = useState<"builder" | "library">("builder");

  // Lightbox Modal for side-by-side or fullscreen inspection
  const [lightboxDrill, setLightboxDrill] = useState<BacktestDrill | null>(null);
  const [activeLightboxPerspective, setActiveLightboxPerspective] = useState<"side-by-side" | "ltp" | "itp" | "stp">("side-by-side");

  // --- Target Calculator & Historical Cascader ---
  const calculateDailyStatuses = (): { 
    statuses: BacktestDayStatus[]; 
    todayTarget: number; 
    todayCompleted: number;
    streakCount: number;
    hasAtLeastOneFailInHistory: boolean;
  } => {
    if (!startDateStr) {
      return { statuses: [], todayTarget: 10, todayCompleted: 0, streakCount: 0, hasAtLeastOneFailInHistory: false };
    }

    let currentDateStr = startDateStr;
    let targetForCurrentDate = 10;
    const statuses: BacktestDayStatus[] = [];

    const tempDate = new Date(startDateStr + 'T00:00:00');
    const todayDateObj = new Date(todayStr + 'T00:00:00');
    
    // Safety check to prevent infinite loop if dates get scrambled
    let iterations = 0;
    while (tempDate <= todayDateObj && iterations < 365) {
      iterations++;
      const dateStr = tempDate.toLocaleDateString('en-CA');
      const drillsForDate = drills.filter(d => d.date === dateStr);
      const completedCount = drillsForDate.length;

      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;

      const target = targetForCurrentDate;
      const isFailed = isPast && (completedCount < target);

      statuses.push({
        date: dateStr,
        target,
        completed: completedCount,
        failed: isFailed
      });

      // Calculate NEXT day's target
      if (isFailed) {
        // Penalty: Target doubles tomorrow!
        targetForCurrentDate = target * 2;
      } else {
        // Succeeded or today is still active, reset to base target
        // Wait, if it is today, did we complete yesterday successfully?
        // If yesterday was failed, today's target is already calculated as yesterday's * 2
        // If yesterday was succeeded (or if there was no yesterday), it remains 10
        targetForCurrentDate = 10;
      }

      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Get stats specifically for today
    const todayStatus = statuses.find(s => s.date === todayStr);
    const todayTarget = todayStatus ? todayStatus.target : 10;
    const todayCompleted = todayStatus ? todayStatus.completed : 0;

    // Calculate Streak
    // Streak is calculated by scanning backwards from today
    // If today is completed, streak includes today. 
    // All previous days must be fully completed to maintain active streak.
    let streakCount = 0;
    let consecutivePassed = true;
    
    // We scan chronologically but reverse to find trailing contiguous "success" days
    const reversedPastStatuses = [...statuses].reverse();
    // Remove today if today is not completed yet so streak indicates completed days
    for (const stat of reversedPastStatuses) {
      const isToday = stat.date === todayStr;
      
      if (isToday) {
        // If today is completed, we count it, otherwise we don't break the streak yet (user still has time today)
        if (stat.completed >= stat.target) {
          streakCount++;
        }
      } else {
        if (stat.completed >= stat.target) {
          streakCount++;
        } else {
          // Failure breaks streak
          break;
        }
      }
    }

    const hasAtLeastOneFailInHistory = statuses.some(s => s.failed);

    return { 
      statuses, 
      todayTarget, 
      todayCompleted, 
      streakCount, 
      hasAtLeastOneFailInHistory 
    };
  };

  const { statuses, todayTarget, todayCompleted, streakCount, hasAtLeastOneFailInHistory } = calculateDailyStatuses();

  // Helper to trigger base64 conversion
  const handleImageUpload = (section: "ltp" | "itp" | "stp", file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      if (section === "ltp") setLtpImage(b64);
      if (section === "itp") setItpImage(b64);
      if (section === "stp") setStpImage(b64);
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop support
  const handleDrag = (e: DragEvent, section: "ltp" | "itp" | "stp") => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [section]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleDrop = (e: DragEvent, section: "ltp" | "itp" | "stp") => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [section]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(section, e.dataTransfer.files[0]);
    }
  };

  const handleFileSelectorChange = (e: ChangeEvent<HTMLInputElement>, section: "ltp" | "itp" | "stp") => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(section, e.target.files[0]);
    }
  };

  // Submit Drill Action
  const handleAddDrill = (e: FormEvent) => {
    e.preventDefault();

    const selectedModel = formModel === "Custom Model" ? customModel : formModel;
    if (!selectedModel.trim()) {
      alert("Please specify or choose a learning model.");
      return;
    }

    const newDrill: BacktestDrill = {
      id: "drill_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      date: todayStr,
      modelName: selectedModel,
      ltpImage,
      ltpNote: ltpNote.trim(),
      itpImage,
      itpNote: itpNote.trim(),
      stpImage,
      stpNote: stpNote.trim(),
      createdAt: new Date().toISOString()
    };

    setDrills(prev => [newDrill, ...prev]);

    // Reset notes & images for next drill
    setLtpNote("");
    setItpNote("");
    setStpNote("");
    setLtpImage(undefined);
    setItpImage(undefined);
    setStpImage(undefined);
    
    // Automatically select Library date as today to reflect latest entry
    setSelectedLibraryDate(todayStr);

    // Dynamic celebration triggers
    const updatedCount = todayCompleted + 1;
    if (updatedCount === todayTarget) {
      alert(`🎉 Target Completed! You logged all ${todayTarget} drills for today! Streak maintained!`);
    }
  };

  // Delete individual drill
  const handleDeleteDrill = (id: string) => {
    if (confirm("Confirm deleting this backtest drill record?")) {
      setDrills(prev => prev.filter(d => d.id !== id));
    }
  };

  // Reset all backtests helper
  const handleResetBacktests = () => {
    if (confirm("⚠️ Danger: This will completely delete all backtest history. Do you want to go ahead?")) {
      setDrills([]);
      // Reset start date to today
      setStartDateStr(todayStr);
      localStorage.setItem("trading_journal_backtest_start_date", todayStr);
    }
  };

  return (
    <div id="backtest-master-panel" className="space-y-6">
      
      {/* 1. Header Banner & Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Streak Scoreboard */}
        <div id="status-card-streak" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${streakCount > 0 ? "bg-amber-50 text-amber-500" : "bg-slate-50 text-slate-400"}`}>
              <Flame className={`w-6 h-6 ${streakCount > 0 ? "fill-amber-500 animate-pulse" : ""}`} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Perfect Practice Streak</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-slate-800">{streakCount}</span>
                <span className="text-xs text-slate-400 font-bold">days</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-bold">
              {streakCount === 0 ? "Start practicing" : streakCount < 3 ? "Warmup" : "Elite Mode"}
            </span>
          </div>
        </div>

        {/* Today's Target Core Card */}
        <div id="status-card-target" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${todayCompleted >= todayTarget ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"}`}>
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Today's Drill Progress</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-slate-800">{todayCompleted}</span>
                <span className="text-slate-400 font-medium">/</span>
                <span className="text-lg font-bold text-slate-600">{todayTarget}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Today's Target</span>
            <span className={`text-xs font-black mt-0.5 ${todayTarget > 10 ? "text-amber-500" : "text-slate-800"}`}>
              {todayTarget > 10 ? `⚠️ Penalty target!` : `Base target 10`}
            </span>
          </div>
        </div>

        {/* Doubling Rule Health */}
        <div id="status-card-rule" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${todayTarget > 10 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"}`}>
              {todayTarget > 10 ? (
                <AlertCircle className="w-6 h-6 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Doubling State</span>
              <p className="font-semibold text-slate-800 text-xs mt-0.5">
                {todayTarget > 10 
                  ? `${todayTarget} required today` 
                  : "Target is fresh static"}
              </p>
              <p className="text-[10px] text-slate-400">Failed targets double next day!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning/Reward notification banner */}
      {todayTarget > 10 && (
        <div className="bg-amber-50/70 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-xl text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            TARGET OVERFLOW RETRIBUTION ACTIVE!
          </p>
          <p>
            Because yesterday's backtest goal was not finalized (completed {statuses.length > 1 ? statuses[statuses.length-2].completed : 0} of {statuses.length > 1 ? statuses[statuses.length-2].target : 10}), your required drills for today doubled to <strong>{todayTarget}</strong>. Absolute discipline is mandatory! Complete them today to restore base targets tomorrow.
          </p>
        </div>
      )}

      {todayCompleted >= todayTarget && todayTarget > 0 && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs space-y-1 border border-emerald-100 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-xl">
             <Sparkles className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          </div>
          <div>
            <p className="font-bold text-emerald-900">Target Defeated! Day Successfully Complete!</p>
            <p>You have hit your core constraint threshold for today. Tomorrow's standard rate returns to 10 drills.</p>
          </div>
        </div>
      )}

      {/* 2. Sub-Tabs selection (Active Drill Builder vs Library Reviews) */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab("builder")}
          className={`pb-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === "builder" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Plus className="w-4 h-4" />
          practice lab (daily logging)
        </button>
        <button
          onClick={() => setActiveSubTab("library")}
          className={`pb-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === "library" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <FolderHeart className="w-4 h-4" />
          drill library & history ({drills.length})
        </button>
      </div>

      {/* 3. Main content body based on Sub-Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE VIEW OR BUILDER FORM (takes up 2 grid slots) */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeSubTab === "builder" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-extrabold text-slate-800 text-sm uppercase tracking-tight flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-600" />
                    Record Drill {todayCompleted + 1} of {todayTarget}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload screenshots and annotate your observations across three separate perspectives.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Today's Date</span>
                  <span className="text-xs text-slate-700 font-bold">{todayStr}</span>
                </div>
              </div>

              {/* Form implementation */}
              <form onSubmit={handleAddDrill} className="space-y-6">
                
                {/* Model selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Model Under Investigation</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={formModel}
                      onChange={(e) => {
                        setFormModel(e.target.value);
                      }}
                      className="text-xs border border-slate-200 p-3 rounded-xl bg-slate-50/50 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600"
                    >
                      {MODEL_PRESETS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="Custom Model">✏️ Custom Trade Setup Model...</option>
                    </select>

                    {formModel === "Custom Model" && (
                      <input
                        type="text"
                        required
                        placeholder="Type Custom Model Name e.g. Fair Value Gap"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        className="text-xs border border-slate-200 p-3 rounded-xl bg-white text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600"
                      />
                    )}
                  </div>
                </div>

                {/* 3 PERSPECTIVE DRAG-AND-DROP WORKSPACES */}
                <div className="space-y-6">
                  
                  {/* Perspective 1: LTP */}
                  <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/20 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                          <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                          LTP: Long Term Perspective (Bias)
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Define high timeframe directions and mark critical liquidity areas.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Image uploader box */}
                      <div className="md:col-span-1">
                        <div
                          onDragEnter={(e) => handleDrag(e, "ltp")}
                          onDragOver={(e) => handleDrag(e, "ltp")}
                          onDragLeave={(e) => handleDrag(e, "ltp")}
                          onDrop={(e) => handleDrop(e, "ltp")}
                          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition min-h-[140px] cursor-pointer relative h-full ${
                            dragActive.ltp ? "border-blue-500 bg-blue-50/20" : ltpImage ? "border-emerald-300 bg-slate-50/50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
                          }`}
                          onClick={() => document.getElementById("uploader-ltp")?.click()}
                        >
                          {ltpImage ? (
                            <div className="absolute inset-2">
                              <img src={ltpImage} alt="LTP" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLtpImage(undefined);
                                }}
                                className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow hover:bg-rose-700 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex justify-center text-slate-400">
                                <TrendingUp className="w-7 h-7" />
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold">LTP Screen</p>
                              <p className="text-[8px] text-slate-400">Click or Drag Image</p>
                            </div>
                          )}
                          <input
                            id="uploader-ltp"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelectorChange(e, "ltp")}
                          />
                        </div>
                      </div>

                      {/* Notes Box */}
                      <div className="md:col-span-2">
                        <textarea
                          required
                          value={ltpNote}
                          onChange={(e) => setLtpNote(e.target.value)}
                          placeholder="REQUIRED: Write down your explicit analysis of the bias and why the high timeframe says price should do this next..."
                          className="w-full h-full min-h-[120px] text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Perspective 2: ITP */}
                  <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/20 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                          <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                          ITP: Intermediate Term Perspective (Supporting Frame)
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Verify market structure alignment on middle timeframes (e.g. 1H/15M).</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Image uploader box */}
                      <div className="md:col-span-1">
                        <div
                          onDragEnter={(e) => handleDrag(e, "itp")}
                          onDragOver={(e) => handleDrag(e, "itp")}
                          onDragLeave={(e) => handleDrag(e, "itp")}
                          onDrop={(e) => handleDrop(e, "itp")}
                          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition min-h-[140px] cursor-pointer relative h-full ${
                            dragActive.itp ? "border-blue-500 bg-blue-50/20" : itpImage ? "border-emerald-300 bg-slate-50/50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
                          }`}
                          onClick={() => document.getElementById("uploader-itp")?.click()}
                        >
                          {itpImage ? (
                            <div className="absolute inset-2">
                              <img src={itpImage} alt="ITP" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItpImage(undefined);
                                }}
                                className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow hover:bg-rose-700 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex justify-center text-slate-400">
                                <TrendingUp className="w-7 h-7" />
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold">ITP Screen</p>
                              <p className="text-[8px] text-slate-400">Click or Drag Image</p>
                            </div>
                          )}
                          <input
                            id="uploader-itp"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelectorChange(e, "itp")}
                          />
                        </div>
                      </div>

                      {/* Notes Box */}
                      <div className="md:col-span-2">
                        <textarea
                          required
                          value={itpNote}
                          onChange={(e) => setItpNote(e.target.value)}
                          placeholder="REQUIRED: Write how the middle timeframe establishes support or invalidates the parent bias (order flow transitions, structure breakdowns, etc.)..."
                          className="w-full h-full min-h-[120px] text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Perspective 3: STP */}
                  <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/20 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                          <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                          STP: Short Term Perspective (Entry Criteria)
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Determine precision triggers, candle behaviors, risk constraints, and execute.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Image uploader box */}
                      <div className="md:col-span-1">
                        <div
                          onDragEnter={(e) => handleDrag(e, "stp")}
                          onDragOver={(e) => handleDrag(e, "stp")}
                          onDragLeave={(e) => handleDrag(e, "stp")}
                          onDrop={(e) => handleDrop(e, "stp")}
                          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition min-h-[140px] cursor-pointer relative h-full ${
                            dragActive.stp ? "border-blue-500 bg-blue-50/20" : stpImage ? "border-emerald-300 bg-slate-50/50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
                          }`}
                          onClick={() => document.getElementById("uploader-stp")?.click()}
                        >
                          {stpImage ? (
                            <div className="absolute inset-2">
                              <img src={stpImage} alt="STP" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStpImage(undefined);
                                }}
                                className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow hover:bg-rose-700 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex justify-center text-slate-400">
                                <TrendingUp className="w-7 h-7" />
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold">STP Screen</p>
                              <p className="text-[8px] text-slate-400">Click or Drag Image</p>
                            </div>
                          )}
                          <input
                            id="uploader-stp"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelectorChange(e, "stp")}
                          />
                        </div>
                      </div>

                      {/* Notes Box */}
                      <div className="md:col-span-2">
                        <textarea
                          required
                          value={stpNote}
                          onChange={(e) => setStpNote(e.target.value)}
                          placeholder="REQUIRED: Describe the exact microscopic entry signals (such as FVG touch, candle sweeps, breaker triggers, stop placements, and Target 1 targets)..."
                          className="w-full h-full min-h-[120px] text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 px-6 rounded-xl transition shadow-xs cursor-pointer uppercase tracking-wider"
                  >
                    Log Completed Drill ({todayCompleted + 1} / {todayTarget})
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSubTab === "library" && (
            <div className="space-y-6">
              
              {/* Day selection tabs */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap gap-2 items-center justify-between">
                <span className="text-xs uppercase font-black text-slate-400 tracking-wider">Historical Library Days</span>
                
                <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
                  {statuses.map((s) => {
                    const countForDay = drills.filter(d => d.date === s.date).length;
                    const isPassed = countForDay >= s.target;
                    const isSlctd = selectedLibraryDate === s.date;
                    
                    return (
                      <button
                        key={s.date}
                        onClick={() => setSelectedLibraryDate(s.date)}
                        className={`text-[11px] font-bold py-2 px-3.5 rounded-xl transition flex flex-col items-center shrink-0 border ${
                          isSlctd 
                            ? "bg-slate-900 border-slate-900 text-white" 
                            : isPassed
                            ? "bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 border-emerald-100/50"
                            : s.failed
                            ? "bg-rose-50 hover:bg-rose-100/80 text-rose-800 border-rose-100"
                            : "bg-slate-100/60 hover:bg-slate-100 text-slate-600 border-transparent"
                        }`}
                      >
                        <span>{s.date === todayStr ? "Today" : s.date}</span>
                        <span className="text-[9px] opacity-80 mt-0.5">
                          {countForDay} / {s.target} Drills
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drill grid for chosen day */}
              {(() => {
                const dayDrills = drills.filter(d => d.date === selectedLibraryDate);
                const dayStatus = statuses.find(s => s.date === selectedLibraryDate);
                const targetForDay = dayStatus ? dayStatus.target : 10;
                
                if (dayDrills.length === 0) {
                  return (
                    <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3">
                      <div className="p-4 bg-slate-50 text-slate-400 inline-block rounded-2xl">
                        <FolderHeart className="w-8 h-8" />
                      </div>
                      <h4 className="font-display font-extrabold text-slate-700 text-sm uppercase">Empty Practice Session</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        No backtest drills have been registered for {selectedLibraryDate}. Go to the <strong>Practice Lab</strong> tab to log your learning drills!
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-100/40 px-4 py-2 rounded-xl">
                      <span className="text-xs text-slate-500 font-bold uppercase">
                        Pratice set: {dayDrills.length} logged out of {targetForDay} required
                      </span>
                      {dayDrills.length >= targetForDay ? (
                        <span className="text-emerald-700 bg-emerald-100 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">
                          Passed Session
                        </span>
                      ) : selectedLibraryDate < todayStr ? (
                        <span className="text-rose-700 bg-rose-100 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">
                          Failed & Doubled Penalty!
                        </span>
                      ) : (
                        <span className="text-blue-700 bg-blue-100 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">
                          In Progress Today
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {dayDrills.map((drill, index) => (
                        <div 
                          key={drill.id} 
                          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-sm transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] bg-slate-100 font-bold px-2 py-1 rounded-lg text-slate-600 block w-max">
                                Drill #{dayDrills.length - index}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm mt-1.5">{drill.modelName}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Analyzed at {new Date(drill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteDrill(drill.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                              title="Delete Drill"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* 3 screenshot thumb row */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-1">
                              <span className="text-[8px] text-slate-400 uppercase font-bold block mb-1">LTP</span>
                              {drill.ltpImage ? (
                                <img src={drill.ltpImage} alt="LTP" className="w-full h-12 object-cover rounded-md" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="h-12 bg-slate-100 rounded flex items-center justify-center text-slate-300">
                                  <TrendingUp className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="text-center rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-1">
                              <span className="text-[8px] text-slate-400 uppercase font-bold block mb-1">ITP</span>
                              {drill.itpImage ? (
                                <img src={drill.itpImage} alt="ITP" className="w-full h-12 object-cover rounded-md" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="h-12 bg-slate-100 rounded flex items-center justify-center text-slate-300">
                                  <TrendingUp className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="text-center rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-1">
                              <span className="text-[8px] text-slate-400 uppercase font-bold block mb-1">STP</span>
                              {drill.stpImage ? (
                                <img src={drill.stpImage} alt="STP" className="w-full h-12 object-cover rounded-md" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="h-12 bg-slate-100 rounded flex items-center justify-center text-slate-300">
                                  <TrendingUp className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Inline notes brief previews */}
                          <div className="bg-slate-50/55 p-3 rounded-xl border border-slate-100/50 text-[11px] space-y-1.5 font-sans">
                            <p className="text-slate-600 line-clamp-1">
                              <strong className="text-slate-800">LTP:</strong> {drill.ltpNote}
                            </p>
                            <p className="text-slate-600 line-clamp-1">
                              <strong className="text-slate-800">ITP:</strong> {drill.itpNote}
                            </p>
                            <p className="text-slate-600 line-clamp-1">
                              <strong className="text-slate-800">STP:</strong> {drill.stpNote}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setLightboxDrill(drill);
                              setActiveLightboxPerspective("side-by-side");
                            }}
                            className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[10px] uppercase font-black w-full py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                            Launch review lab inspect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DISCIPLINE CORE, DOUBLING CALCULATOR, RULES HELPER (takes up 1 grid slot) */}
        <div className="space-y-6">
          
          {/* Calendar Discipline Timeline Status list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h4 className="font-display font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-500" />
                Practice Timeline Logs
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Your historical tracking days. Failures double tomorrow targets.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {statuses.map((stat) => {
                const count = stat.completed;
                const isPassed = count >= stat.target;
                
                return (
                  <div 
                    key={stat.date} 
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                      stat.date === todayStr 
                        ? "bg-blue-50/40 border-blue-100 font-semibold" 
                        : isPassed 
                        ? "bg-emerald-50/30 border-emerald-100/50 text-slate-700" 
                        : stat.failed 
                        ? "bg-rose-50/40 border-rose-100 text-slate-700" 
                        : "bg-slate-100/30 border-transparent text-slate-500"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        {stat.date}
                        {stat.date === todayStr && (
                          <span className="text-[8px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                            Today
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Completed {count} of {stat.target} drills
                      </p>
                    </div>

                    <div>
                      {stat.date === todayStr ? (
                        <span className="font-semibold text-blue-600">{Math.round((count/stat.target)*100)}%</span>
                      ) : isPassed ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase">
                          Pass
                        </span>
                      ) : stat.failed ? (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase animate-pulse">
                          Fail (*2)
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-2">
              <button
                onClick={handleResetBacktests}
                className="text-[10px] text-rose-500 hover:text-rose-600 font-semibold underline flex items-center gap-1 cursor-pointer transition"
              >
                Reset Backtest History Storage
              </button>
            </div>
          </div>

          {/* Model Learn Rules constraints helper */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              doubling execution rules
            </h4>
            
            <p className="text-[11px] text-slate-300 leading-relaxed">
              To master trading, you require daily deliberate practice:
            </p>

            <ul className="text-[10px] text-slate-300 space-y-3 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <p>
                  <strong>10 Drills Base:</strong> Daily quota begins fresh at 10 high-quality model alignments to solidify muscle memory.
                </p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">2.</span>
                <p>
                  <strong>The Doubling Penalty:</strong> If you close a day without submitting all your required drills, tomorrow's target <strong>doubles</strong> sequentially!
                </p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-400 font-bold">3.</span>
                <p>
                  <strong>LTP + ITP + STP:</strong> For each log, you are bound to detail the macro narrative (LTP), structural verification (ITP), and execution trigger (STP).
                </p>
              </li>
            </ul>

            <div className="bg-white/10 p-3.5 rounded-xl text-[10px] text-slate-200">
              💡 <strong>Pro Tip:</strong> Stick to simple names like "Silver Bullet" or "MSS" and backtest chronological days step-by-step.
            </div>
          </div>

        </div>

      </div>

      {/* --- SIDE-BY-SIDE / FULLSCREEN INSPECTION LIGHTBOX MODAL --- */}
      {lightboxDrill && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-50">
          <div className="bg-slate-900 border border-slate-700/60 rounded-3xl max-w-5xl w-full h-[90vh] md:h-[86vh] flex flex-col shadow-2xl text-white">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 rounded-t-3xl">
              <div>
                <span className="text-xs text-blue-400 font-black tracking-wider uppercase bg-blue-950/40 px-3 py-1 rounded-full border border-blue-900/40">
                  Review Lab Inspector
                </span>
                <h3 className="font-display font-extrabold text-base tracking-tight mt-1">
                  {lightboxDrill.modelName} <span className="text-slate-400 font-normal">({lightboxDrill.date})</span>
                </h3>
              </div>

              <div className="flex items-center gap-4">
                {/* Visual perspective presets */}
                <div className="hidden sm:flex bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-700/60 shadow-inner">
                  <button
                    onClick={() => setActiveLightboxPerspective("side-by-side")}
                    className={`px-3 py-1.5 rounded-lg transition ${activeLightboxPerspective === "side-by-side" ? "bg-slate-950 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    Compare Side-By-Side
                  </button>
                  <button
                    onClick={() => setActiveLightboxPerspective("ltp")}
                    className={`px-3 py-1.5 rounded-lg transition ${activeLightboxPerspective === "ltp" ? "bg-slate-950 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    LTP Bias
                  </button>
                  <button
                    onClick={() => setActiveLightboxPerspective("itp")}
                    className={`px-3 py-1.5 rounded-lg transition ${activeLightboxPerspective === "itp" ? "bg-slate-950 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    ITP Support
                  </button>
                  <button
                    onClick={() => setActiveLightboxPerspective("stp")}
                    className={`px-3 py-1.5 rounded-lg transition ${activeLightboxPerspective === "stp" ? "bg-slate-950 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    STP Trigger
                  </button>
                </div>

                <button
                  onClick={() => setLightboxDrill(null)}
                  className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Scroll */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              
              {/* Perspective toggles for mobile view */}
              <div className="flex sm:hidden bg-slate-800 p-1 rounded-xl text-[10px] font-bold border border-slate-700/60 justify-between">
                <button
                  onClick={() => setActiveLightboxPerspective("side-by-side")}
                  className={`px-2.5 py-1.5 rounded-lg transition flex-1 text-center ${activeLightboxPerspective === "side-by-side" ? "bg-slate-950 text-white" : "text-slate-400"}`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveLightboxPerspective("ltp")}
                  className={`px-2.5 py-1.5 rounded-lg transition flex-1 text-center ${activeLightboxPerspective === "ltp" ? "bg-slate-950 text-white" : "text-slate-400"}`}
                >
                  LTP
                </button>
                <button
                  onClick={() => setActiveLightboxPerspective("itp")}
                  className={`px-2.5 py-1.5 rounded-lg transition flex-1 text-center ${activeLightboxPerspective === "itp" ? "bg-slate-950 text-white" : "text-slate-400"}`}
                >
                  ITP
                </button>
                <button
                  onClick={() => setActiveLightboxPerspective("stp")}
                  className={`px-2.5 py-1.5 rounded-lg transition flex-1 text-center ${activeLightboxPerspective === "stp" ? "bg-slate-950 text-white" : "text-slate-400"}`}
                >
                  STP
                </button>
              </div>

              {/* Side by side layout compare */}
              {activeLightboxPerspective === "side-by-side" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                  
                  {/* LTP card */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest block pb-2 border-b border-slate-800">
                        1. LTP High Timeframe Bias
                      </span>
                      {lightboxDrill.ltpImage ? (
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                          <img src={lightboxDrill.ltpImage} alt="LTP high res" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                          No screen captured
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl mt-3">
                      <h5 className="text-[10px] uppercase font-black text-slate-400 mb-1">Observation narrative</h5>
                      <p className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                        {lightboxDrill.ltpNote}
                      </p>
                    </div>
                  </div>

                  {/* ITP card */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block pb-2 border-b border-slate-800">
                        2. ITP Structural Alignment
                      </span>
                      {lightboxDrill.itpImage ? (
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                          <img src={lightboxDrill.itpImage} alt="ITP high res" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                          No screen captured
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl mt-3">
                      <h5 className="text-[10px] uppercase font-black text-slate-400 mb-1">Observation narrative</h5>
                      <p className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                        {lightboxDrill.itpNote}
                      </p>
                    </div>
                  </div>

                  {/* STP card */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest block pb-2 border-b border-slate-800">
                        3. STP Entry Trigger & Targets
                      </span>
                      {lightboxDrill.stpImage ? (
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                          <img src={lightboxDrill.stpImage} alt="STP high res" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                          No screen captured
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl mt-3">
                      <h5 className="text-[10px] uppercase font-black text-slate-400 mb-1">Observation narrative</h5>
                      <p className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                        {lightboxDrill.stpNote}
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* Individual Single Focus View Details */}
              {activeLightboxPerspective === "ltp" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase text-rose-400">1. Long Term Perspective (The Bias)</h4>
                  {lightboxDrill.ltpImage && (
                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black max-h-[500px]">
                      <img src={lightboxDrill.ltpImage} alt="LTP Focus" className="w-full h-full max-h-[500px] object-contain mx-auto" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
                    <p className="text-sm text-slate-100 font-sans leading-relaxed whitespace-pre-wrap">
                      {lightboxDrill.ltpNote}
                    </p>
                  </div>
                </div>
              )}

              {activeLightboxPerspective === "itp" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase text-amber-400">2. Intermediate Term Perspective (Supporting structural framework)</h4>
                  {lightboxDrill.itpImage && (
                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black max-h-[500px]">
                      <img src={lightboxDrill.itpImage} alt="ITP Focus" className="w-full h-full max-h-[500px] object-contain mx-auto" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
                    <p className="text-sm text-slate-100 font-sans leading-relaxed whitespace-pre-wrap">
                      {lightboxDrill.itpNote}
                    </p>
                  </div>
                </div>
              )}

              {activeLightboxPerspective === "stp" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase text-emerald-400">3. Short Term Perspective (Entry execution constraints)</h4>
                  {lightboxDrill.stpImage && (
                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black max-h-[500px]">
                      <img src={lightboxDrill.stpImage} alt="STP Focus" className="w-full h-full max-h-[500px] object-contain mx-auto" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
                    <p className="text-sm text-slate-100 font-sans leading-relaxed whitespace-pre-wrap">
                      {lightboxDrill.stpNote}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
