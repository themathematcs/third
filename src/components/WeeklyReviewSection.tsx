import { useState, useEffect } from "react";
import { WeeklyReview } from "../types";
import { Check, ClipboardList, TrendingUp, AlertTriangle, Lightbulb, Save, CheckCircle } from "lucide-react";

interface WeeklyReviewSectionProps {
  week: string;
  savedReview?: WeeklyReview;
  onSave: (review: WeeklyReview) => void;
}

export default function WeeklyReviewSection({
  week,
  savedReview,
  onSave,
}: WeeklyReviewSectionProps) {
  // Local state initialized by saved review or empty template
  const [formData, setFormData] = useState<WeeklyReview>({
    week,
    winningTradeTakeAgain: "",
    winningYesExecution: "",
    winningYesManagement: "",
    winningYesRepeat: "",
    winningNoDeviation: "",
    winningNoAvoided: "",
    winningNoIncorrect: "",

    losingTradeTakeAgain: "",
    losingYesAvoidLoss: "",
    losingYesWellDone: "",
    losingYesEmotions: "",
    losingNoDeviation: "",
    losingNoWarning: "",
    losingNoImpact: "",

    overallMissedTrade: "",
    overallDifferentThisWeek: "",
    overallBetterExecution: "",
    overallMindsetImpact: "",
    overallNextWeekActions: "",

    strengthCause: "",
    strengthPurpose: "",
    strengthAction: "",

    mistakeCause: "",
    mistakePurpose: "",
    mistakeAction: "",

    isCompleted: false,
    updatedAt: new Date().toISOString(),
  });

  // Load saved review if exists, or reset for a new week
  useEffect(() => {
    if (savedReview) {
      setFormData(savedReview);
    } else {
      setFormData({
        week,
        winningTradeTakeAgain: "",
        winningYesExecution: "",
        winningYesManagement: "",
        winningYesRepeat: "",
        winningNoDeviation: "",
        winningNoAvoided: "",
        winningNoIncorrect: "",

        losingTradeTakeAgain: "",
        losingYesAvoidLoss: "",
        losingYesWellDone: "",
        losingYesEmotions: "",
        losingNoDeviation: "",
        losingNoWarning: "",
        losingNoImpact: "",

        overallMissedTrade: "",
        overallDifferentThisWeek: "",
        overallBetterExecution: "",
        overallMindsetImpact: "",
        overallNextWeekActions: "",

        strengthCause: "",
        strengthPurpose: "",
        strengthAction: "",

        mistakeCause: "",
        mistakePurpose: "",
        mistakeAction: "",

        isCompleted: false,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [savedReview, week]);

  const [toastMessage, setToastMessage] = useState("");

  const handleFieldChange = (field: keyof WeeklyReview, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check completion steps
  const isWinningStepDone = formData.winningTradeTakeAgain !== "" && (
    formData.winningTradeTakeAgain === "YES"
      ? (formData.winningYesExecution.trim() !== "" || formData.winningYesManagement.trim() !== "" || formData.winningYesRepeat.trim() !== "")
      : (formData.winningNoDeviation.trim() !== "" || formData.winningNoAvoided.trim() !== "" || formData.winningNoIncorrect.trim() !== "")
  );

  const isLosingStepDone = formData.losingTradeTakeAgain !== "" && (
    formData.losingTradeTakeAgain === "YES"
      ? (formData.losingYesAvoidLoss.trim() !== "" || formData.losingYesWellDone.trim() !== "" || formData.losingYesEmotions.trim() !== "")
      : (formData.losingNoDeviation.trim() !== "" || formData.losingNoWarning.trim() !== "" || formData.losingNoImpact.trim() !== "")
  );

  const isOverallStepDone = 
    formData.overallMissedTrade.trim() !== "" || 
    formData.overallDifferentThisWeek.trim() !== "" ||
    formData.strengthCause.trim() !== "" ||
    formData.mistakeCause.trim() !== "";

  const handleSave = (markCompleted: boolean = false) => {
    const finalData = {
      ...formData,
      isCompleted: markCompleted ? true : formData.isCompleted,
      updatedAt: new Date().toISOString(),
    };
    setFormData(finalData);
    onSave(finalData);

    setToastMessage(markCompleted ? "Review submitted and locked!" : "Progress saved successfully.");
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div id="weekly-review-section" className="space-y-8 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <Check className="text-emerald-500 w-5 h-5" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Week Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Reflection Window
          </span>
          <h2 className="text-2xl font-display font-bold text-slate-800 mt-2">
            Weekly Review — {week}
          </h2>
          <p className="text-sm text-slate-500">
            Review your decisions, analyze trading behaviors, and set clear adjustments for tomorrow.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleSave(false)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-medium text-sm"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-medium text-sm shadow-sm"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Lock & Complete
          </button>
        </div>
      </div>

      {/* Checklist (Visual replica of step box in the screenshot) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-display font-semibold text-slate-800 flex items-center gap-2 mb-3">
          <ClipboardList className="w-5 h-5 text-slate-500" />
          Weekly Review Steps
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Follow the steps below to complete the weekly review:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`p-4 rounded-xl border flex items-center justify-between transition ${isWinningStepDone ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${isWinningStepDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {isWinningStepDone ? <Check className="w-3.5 h-3.5" /> : "1"}
              </span>
              <span className="text-sm font-medium text-slate-700">Winning Trades</span>
            </div>
            <span className={`text-xs ${isWinningStepDone ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isWinningStepDone ? "Completed" : "Pending"}
            </span>
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between transition ${isLosingStepDone ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${isLosingStepDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {isLosingStepDone ? <Check className="w-3.5 h-3.5" /> : "2"}
              </span>
              <span className="text-sm font-medium text-slate-700">Losing Trades</span>
            </div>
            <span className={`text-xs ${isLosingStepDone ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isLosingStepDone ? "Completed" : "Pending"}
            </span>
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between transition ${isOverallStepDone ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${isOverallStepDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {isOverallStepDone ? <Check className="w-3.5 h-3.5" /> : "3"}
              </span>
              <span className="text-sm font-medium text-slate-700">Overall Performance</span>
            </div>
            <span className={`text-xs ${isOverallStepDone ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isOverallStepDone ? "Completed" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Flow for Win / Loss reflection (exact replica of Winning/Losing boxes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 1: Winning Trades */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-emerald-500 w-5 h-5" />
              Winning Trades Reflect
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select if you would repeat winning setups to trigger custom review pathways.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Is this a trade you would take again without knowing the outcome was a win?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFieldChange("winningTradeTakeAgain", "YES")}
                className={`py-2.5 px-4 rounded-xl font-medium border text-sm transition text-center ${
                  formData.winningTradeTakeAgain === "YES"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange("winningTradeTakeAgain", "NO")}
                className={`py-2.5 px-4 rounded-xl font-medium border text-sm transition text-center ${
                  formData.winningTradeTakeAgain === "NO"
                    ? "bg-rose-50 border-rose-500 text-rose-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Conditional questions for Winning Trades */}
          {formData.winningTradeTakeAgain === "YES" && (
            <div className="space-y-5 border-t border-slate-50 pt-5 animate-fadeIn">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50/50 py-1 px-2.5 rounded max-w-max">
                Pathway: Valid Winning Playbook
              </p>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  What would you improve with your execution on this trade?
                </label>
                <textarea
                  value={formData.winningYesExecution}
                  onChange={(e) => handleFieldChange("winningYesExecution", e.target.value)}
                  placeholder="E.g., Entry slippage control, patience on the trigger..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50/20"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  How could you have managed this trade to increase the profit?
                </label>
                <textarea
                  value={formData.winningYesManagement}
                  onChange={(e) => handleFieldChange("winningYesManagement", e.target.value)}
                  placeholder="E.g., Scaling out some position, trailing stop behind key structure..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50/20"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  What can you do to repeat this type of trade in the future?
                </label>
                <textarea
                  value={formData.winningYesRepeat}
                  onChange={(e) => handleFieldChange("winningYesRepeat", e.target.value)}
                  placeholder="E.g., Set alarms for this specific breakout pattern..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50/20"
                  rows={3}
                />
              </div>
            </div>
          )}

          {formData.winningTradeTakeAgain === "NO" && (
            <div className="space-y-5 border-t border-slate-50 pt-5 animate-fadeIn">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 bg-rose-50/50 py-1 px-2.5 rounded max-w-max">
                Pathway: Flawed Win / Deviation
              </p>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  Where did you deviate from your plan or approach and why?
                </label>
                <textarea
                  value={formData.winningNoDeviation}
                  onChange={(e) => handleFieldChange("winningNoDeviation", e.target.value)}
                  placeholder="E.g., Entered due to FOMO before structure validation..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50/20"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  How could this flawed win have been avoided in the future?
                </label>
                <textarea
                  value={formData.winningNoAvoided}
                  onChange={(e) => handleFieldChange("winningNoAvoided", e.target.value)}
                  placeholder="E.g., Respecting hard rules, locking trading terminal..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50/20"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  What specifically was done incorrectly in this trade despite the outcome?
                </label>
                <textarea
                  value={formData.winningNoIncorrect}
                  onChange={(e) => handleFieldChange("winningNoIncorrect", e.target.value)}
                  placeholder="E.g., Risking 3x regular size, averaging down into a winner..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50/20"
                  rows={3}
                />
              </div>
            </div>
          )}

          {formData.winningTradeTakeAgain === "" && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
              <p className="text-xs text-slate-400">Choose Yes or No at the top to load trade questions.</p>
            </div>
          )}
        </div>

        {/* Section 2: Losing Trades */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="text-rose-500 w-5 h-5" />
              Losing Trades Reflect
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Analyze invalid setups or correct execution despite outcome rules.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Is this a trade you would take again without knowing the outcome was a loss?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFieldChange("losingTradeTakeAgain", "YES")}
                className={`py-2.5 px-4 rounded-xl font-medium border text-sm transition text-center ${
                  formData.losingTradeTakeAgain === "YES"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange("losingTradeTakeAgain", "NO")}
                className={`py-2.5 px-4 rounded-xl font-medium border text-sm transition text-center ${
                  formData.losingTradeTakeAgain === "NO"
                    ? "bg-rose-50 border-rose-500 text-rose-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Conditional questions for Losing Trades */}
          {formData.losingTradeTakeAgain === "YES" && (
            <div className="space-y-5 border-t border-slate-50 pt-5 animate-fadeIn">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50/50 py-1 px-2.5 rounded max-w-max">
                Pathway: Valid Losing Playbook
              </p>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  Was there any logical way to avoid this loss in the moment?
                </label>
                <textarea
                  value={formData.losingYesAvoidLoss}
                  onChange={(e) => handleFieldChange("losingYesAvoidLoss", e.target.value)}
                  placeholder="E.g., High impact news release occurring during live trade, spread anomalies..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50/20"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  What specifically was done well in this trade despite the outcome?
                </label>
                <textarea
                  value={formData.losingYesWellDone}
                  onChange={(e) => handleFieldChange("losingYesWellDone", e.target.value)}
                  placeholder="E.g., Strictly adhered to stop loss placement, did not move risk buffer..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50/20"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  Were emotions controlled after this losing trade was realized?
                </label>
                <textarea
                  value={formData.losingYesEmotions}
                  onChange={(e) => handleFieldChange("losingYesEmotions", e.target.value)}
                  placeholder="E.g., Walked away immediately, no urge to scale back or revenge-trade..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50/20"
                  rows={3}
                />
              </div>
            </div>
          )}

          {formData.losingTradeTakeAgain === "NO" && (
            <div className="space-y-5 border-t border-slate-50 pt-5 animate-fadeIn">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 bg-rose-50/50 py-1 px-2.5 rounded max-w-max">
                Pathway: Invalid Trade / Bad Practice
              </p>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  Where did you deviate from your plan or approach and why?
                </label>
                <textarea
                  value={formData.losingNoDeviation}
                  onChange={(e) => handleFieldChange("losingNoDeviation", e.target.value)}
                  placeholder="E.g., Over-leveraged, chased a runner without validation..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50/20"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  What were the warning signs that led into this losing trade?
                </label>
                <textarea
                  value={formData.losingNoWarning}
                  onChange={(e) => handleFieldChange("losingNoWarning", e.target.value)}
                  placeholder="E.g., Decreasing volume, major resistances near entry targets..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50/20"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 leading-relaxed">
                  How did you respond to the outcome of this trade and did it impact following trades?
                </label>
                <textarea
                  value={formData.losingNoImpact}
                  onChange={(e) => handleFieldChange("losingNoImpact", e.target.value)}
                  placeholder="E.g., Felt frustrated, entered next asset out of urgency..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50/20"
                  rows={3}
                />
              </div>
            </div>
          )}

          {formData.losingTradeTakeAgain === "" && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
              <p className="text-xs text-slate-400">Choose Yes or No at the top to load trade questions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Overall Performance */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
            <Lightbulb className="text-amber-500 w-5 h-5" />
            Overall Weekly Performance Review
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            General analysis of your executing behaviors, repeating habits & mindset during this week.
          </p>
        </div>

        <div className="space-y-6">
          {/* Missed Trades */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Is there a valid trade that you missed in the past week?
            </label>
            <p className="text-xs text-slate-400 mb-1">
              What was the reason for missing it and how can you get onside with a similar move in the future?
            </p>
            <textarea
              value={formData.overallMissedTrade}
              onChange={(e) => handleFieldChange("overallMissedTrade", e.target.value)}
              placeholder="E.g., Missed NASDAQ gap fills because I was distracted by smaller assets. Next time, I will set pre-market trigger alerts."
              className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 bg-slate-50/20"
              rows={3}
            />
          </div>

          {/* This Week vs Last Week Multi-part */}
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider text-slate-600">
              Tactical Comparison & Execution Adjustments
            </h4>
            
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                What did you do this week that you did not do last week and how did it impact the outcome?
              </label>
              <textarea
                value={formData.overallDifferentThisWeek}
                onChange={(e) => handleFieldChange("overallDifferentThisWeek", e.target.value)}
                placeholder="E.g., Kept trade size fixed. This dramatically reduced overall stress even when taking 3 losses back-to-back."
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 bg-slate-50/20"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Did you execute your process better this week in comparison to the previous week?
                </label>
                <textarea
                  value={formData.overallBetterExecution}
                  onChange={(e) => handleFieldChange("overallBetterExecution", e.target.value)}
                  placeholder="Yes, entries were 80% strictly aligned to the model..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 bg-slate-50/20"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  How did previous results impact your mindset this week?
                </label>
                <textarea
                  value={formData.overallMindsetImpact}
                  onChange={(e) => handleFieldChange("overallMindsetImpact", e.target.value)}
                  placeholder="Last week's win streak made me slightly overconfident on Monday, leading to..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 bg-slate-50/20"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                What actions must be taken now to ensure improvement is made next week?
              </label>
              <textarea
                value={formData.overallNextWeekActions}
                onChange={(e) => handleFieldChange("overallNextWeekActions", e.target.value)}
                placeholder="E.g., Stop trading by noon, disable keyboard hotkeys during news, write daily checklist before opening charts."
                className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 bg-slate-50/20"
                rows={2}
              />
            </div>
          </div>

          {/* Repeating Strengths */}
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <h4 className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Did you notice any repeating strengths to build on?
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Identify: What caused these decisions?
                </label>
                <textarea
                  value={formData.strengthCause}
                  onChange={(e) => handleFieldChange("strengthCause", e.target.value)}
                  placeholder="E.g., Consistent morning routines and chart markups."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50/25"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Purpose: Why continue this strength?
                </label>
                <textarea
                  value={formData.strengthPurpose}
                  onChange={(e) => handleFieldChange("strengthPurpose", e.target.value)}
                  placeholder="E.g., Gives high clarity entries and prevents FOMO."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50/25"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Action: Steps to further improve?
                </label>
                <textarea
                  value={formData.strengthAction}
                  onChange={(e) => handleFieldChange("strengthAction", e.target.value)}
                  placeholder="E.g., Log setups cleanly to calculate precise win rate of pattern."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50/25"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Repeating Mistakes */}
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <h4 className="text-sm font-semibold text-rose-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Did you notice any repeating mistakes to resolve?
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Identify: What caused these decisions?
                </label>
                <textarea
                  value={formData.mistakeCause}
                  onChange={(e) => handleFieldChange("mistakeCause", e.target.value)}
                  placeholder="E.g., Staring at trade-chart after entry, inciting manual stops/fears."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50/25"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Purpose: Why remove this mistake?
                </label>
                <textarea
                  value={formData.mistakePurpose}
                  onChange={(e) => handleFieldChange("mistakePurpose", e.target.value)}
                  placeholder="E.g., Cuts winners short and breaks overall math of system."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50/25"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Action: Steps to avoid them going forward?
                </label>
                <textarea
                  value={formData.mistakeAction}
                  onChange={(e) => handleFieldChange("mistakeAction", e.target.value)}
                  placeholder="E.g., Set TP / SL, close browser, and do not look for 2 hours."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50/25"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-3 pb-12">
        <button
          onClick={() => handleSave(false)}
          className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-semibold text-sm shadow-sm"
        >
          Save Draft Work
        </button>
        <button
          onClick={() => handleSave(true)}
          className="px-8 py-3 bg-slate-900 text-white hover:bg-slate-800 transition rounded-xl font-semibold text-sm shadow-md flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          Complete Review for {week}
        </button>
      </div>
    </div>
  );
}
