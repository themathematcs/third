import { useState } from "react";
import { Trade, WeeklyReview } from "../types";
import { TrendingUp, TrendingDown, Percent, Award, Briefcase, Activity, Calendar, FileText } from "lucide-react";

interface DashboardProps {
  trades: Trade[];
  reviews: WeeklyReview[];
}

export default function Dashboard({ trades, reviews }: DashboardProps) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // General Statistics Calculation
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.outcome === "WIN");
  const losses = trades.filter((t) => t.outcome === "LOSS");
  const breakevens = trades.filter((t) => t.outcome === "BREAKEVEN");

  const totalWinsCount = wins.length;
  const totalLossesCount = losses.length;
  
  // Win rate based on closed outcomes (excluding breakevens from the denominator or including depending on style, commonly: wins / (wins + losses) or wins / total)
  // Let's use standard: wins / total (or wins / (total - breakevens) if total > breakevens)
  const denominator = totalTrades - breakevens.length;
  const winRate = denominator > 0 ? Math.round((totalWinsCount / denominator) * 100) : 0;
  const rawWinRate = totalTrades > 0 ? Math.round((totalWinsCount / totalTrades) * 100) : 0;

  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);

  // Profit Factor = sum of positive pnl / abs(sum of negative pnl)
  const grossProfit = trades.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "∞" : "0.00";

  // Average Win and Average Loss sizes
  const avgWin = totalWinsCount > 0 ? grossProfit / totalWinsCount : 0;
  const avgLoss = totalLossesCount > 0 ? grossLoss / totalLossesCount : 0;
  const riskRewardRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "0.00";

  // Grouping Trades by Week/Month for visual rendering
  // Let's extract month names from YYYY-MM-DD
  const monthsDataMap: { [key: string]: { win: number; loss: number; pnl: number; count: number } } = {};
  
  // Sort trades chronologically
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedTrades.forEach((trade) => {
    try {
      const dateObj = new Date(trade.date);
      // Format to "MMM YYYY" e.g. "Jun 2026"
      const formattedMonth = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      
      if (!monthsDataMap[formattedMonth]) {
        monthsDataMap[formattedMonth] = { win: 0, loss: 0, pnl: 0, count: 0 };
      }
      
      monthsDataMap[formattedMonth].count += 1;
      monthsDataMap[formattedMonth].pnl += trade.pnl;
      if (trade.outcome === "WIN") monthsDataMap[formattedMonth].win += 1;
      if (trade.outcome === "LOSS") monthsDataMap[formattedMonth].loss += 1;
    } catch (e) {
      // fallback
    }
  });

  const monthKeys = Object.keys(monthsDataMap);
  const chartHeight = 160;
  // Maximum absolute P&L to scale the chart bars
  const maxPnl = Math.max(...monthKeys.map(k => Math.abs(monthsDataMap[k].pnl)), 500);

  // Grouping Trades by Week for the week selector/overview
  const weeksDataMap: { [key: string]: { win: number; loss: number; pnl: number; count: number } } = {};
  sortedTrades.forEach((trade) => {
    const weekKey = trade.week || "Unassigned";
    if (!weeksDataMap[weekKey]) {
      weeksDataMap[weekKey] = { win: 0, loss: 0, pnl: 0, count: 0 };
    }
    weeksDataMap[weekKey].count += 1;
    weeksDataMap[weekKey].pnl += trade.pnl;
    if (trade.outcome === "WIN") weeksDataMap[weekKey].win += 1;
    if (trade.outcome === "LOSS") weeksDataMap[weekKey].loss += 1;
  });

  const sortedWeeks = Object.keys(weeksDataMap).sort((a, b) => {
    const aNum = parseInt(a.replace(/^\D+/g, ""));
    const bNum = parseInt(b.replace(/^\D+/g, ""));
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return a.localeCompare(b);
  });

  return (
    <div id="analytics-dashboard" className="space-y-8 max-w-5xl mx-auto">
      
      {/* 1. High-Level Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Net Profit */}
        <div id="stat-card-pnl" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net P&L</span>
            <div className={`p-2 rounded-xl ${totalPnL >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
              {totalPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-display font-bold tracking-tight ${totalPnL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Overall accumulated outcome</p>
          </div>
        </div>

        {/* Win Rate Stats */}
        <div id="stat-card-winrate" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Win Rate</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <div>
              <h3 className="text-2xl font-display font-bold tracking-tight text-slate-800">
                {rawWinRate}%
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {winRate}% excl. breakevens
              </p>
            </div>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5 ml-auto">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${rawWinRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Profit Factor */}
        <div id="stat-card-profit-factor" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profit Factor</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-display font-bold tracking-tight text-slate-800">
              {profitFactor}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Ratio: Gross Wins / Gross Losses</p>
          </div>
        </div>

        {/* Total Trades Profile */}
        <div id="stat-card-total-trades" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Actions</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 animate-pulse">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-2xl font-display font-bold tracking-tight text-slate-800">
              {totalTrades}
            </h3>
            <p className="text-xs text-slate-400">
              ({totalWinsCount}W - {totalLossesCount}L - {breakevens.length}B)
            </p>
          </div>
        </div>
      </div>

      {/* 2. Visual Performance Charts & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Monthly Performance Visualizer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-800">Monthly Performance Graph</h3>
              <p className="text-xs text-slate-400">Visual trend showing monthly cumulative profit/loss</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Green (Gain)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded"></span> Red (Drawdown)</span>
            </div>
          </div>

          {monthKeys.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
              <p>No monthly metrics available yet.</p>
              <p className="text-xs text-slate-400 mt-1">Add details of completed trades to draw performance trends.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Custom SVG Bar Chart */}
              <div className="flex items-end justify-between font-mono text-xs text-slate-400 px-4 h-56 pt-6">
                {monthKeys.map((key, idx) => {
                  const data = monthsDataMap[key];
                  // Calculate height relative to max absolute P&L
                  const valPercentage = Math.min((Math.abs(data.pnl) / maxPnl) * 100, 100);
                  const isGain = data.pnl >= 0;
                  
                  return (
                    <div 
                      key={key} 
                      className="flex-1 flex flex-col items-center justify-end h-full px-2 relative group"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Bar Container */}
                      <div className="relative w-full flex flex-col justify-end h-40">
                        {/* Hover Tooltip */}
                        {hoveredBarIndex === idx && (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-white p-3 rounded-lg text-[11px] shadow-2xl z-20 w-44 space-y-1 text-left pointer-events-none animate-fadeIn">
                            <p className="font-bold border-b border-slate-800 pb-1 text-slate-300">{key}</p>
                            <p className="flex justify-between">
                              <span>Total Net P&L:</span> 
                              <span className={isGain ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                {isGain ? "+" : ""}${data.pnl.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span>Volume:</span> 
                              <span className="font-bold text-slate-200">{data.count} trades</span>
                            </p>
                            <p className="flex justify-between">
                              <span>Wins/Losses:</span> 
                              <span className="text-slate-300">{data.win}W - {data.loss}L</span>
                            </p>
                          </div>
                        )}
                        
                        {/* The Actual Bar */}
                        <div 
                          className={`w-full rounded-t transition-all duration-300 relative cursor-pointer ${
                            isGain 
                              ? "bg-slate-900 border-t-2 border-emerald-500 hover:bg-slate-800" 
                              : "bg-slate-200 border-t-2 border-rose-500 hover:bg-slate-300"
                          }`}
                          style={{ height: `${valPercentage}%` }}
                        >
                          <div className={`absolute inset-x-0 top-0 h-4 bg-gradient-to-b opacity-10 rounded-t ${isGain ? 'from-emerald-400' : 'from-rose-400'}`}></div>
                        </div>
                      </div>

                      {/* X Axis Label */}
                      <span className="text-[10px] text-slate-500 mt-2 font-display uppercase tracking-wider">{key.split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="h-[1px] bg-slate-100 w-full mt-4"></div>
            </div>
          )}
        </div>

        {/* Detailed Trader Math Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-lg font-display font-bold text-slate-800">Journal Metrics</h3>
          <p className="text-xs text-slate-400">Detailed mathematical insights computed from your trade records.</p>
          
          <div className="space-y-4">
            
            {/* Average Win Size */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider">
                <span>Avg Win Amount</span>
                <span className="text-emerald-600 font-bold">Profit Setup</span>
              </div>
              <p className="text-lg font-semibold text-slate-800 mt-1">
                ${avgWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Average Loss Size */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider">
                <span>Avg Loss Amount</span>
                <span className="text-rose-500 font-bold">Risk Drawdown</span>
              </div>
              <p className="text-lg font-semibold text-slate-800 mt-1">
                ${avgLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Risk to Reward Ratio */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Risk-to-Reward Ratio</span>
              <span className="text-sm font-mono font-bold text-slate-800">{riskRewardRatio}x</span>
            </div>

            {/* Win/Loss Ratio Visual Progress */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Wins ({totalWinsCount})</span>
                <span>Losses ({totalLossesCount})</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${(totalWinsCount / (totalWinsCount + totalLossesCount || 1)) * 100}%` }}
                />
                <div 
                  className="bg-rose-400 h-full transition-all duration-500" 
                  style={{ width: `${(totalLossesCount / (totalWinsCount + totalLossesCount || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Progress by Weeks (Table & Reviews sync status) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-display font-bold text-slate-800">Weekly Performance Record</h3>
          <p className="text-xs text-slate-400">P&L statistics and Review completion status for each trade week</p>
        </div>

        {sortedWeeks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
            No weekly groups created yet. Group weeks by logging trades.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Trading Week</th>
                  <th className="py-3 px-4">Trade Volume</th>
                  <th className="py-3 px-4">Win/Loss Record</th>
                  <th className="py-3 px-4">Weekly P&L</th>
                  <th className="py-3 px-4 text-right">Review Questionnaire Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedWeeks.map((weekName) => {
                  const weekStats = weeksDataMap[weekName];
                  const linkedReview = reviews.find((r) => r.week === weekName);
                  const isCompleted = linkedReview?.isCompleted;
                  
                  return (
                    <tr key={weekName} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {weekName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {weekStats.count} trades
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="text-emerald-600 font-semibold">{weekStats.win} Wins</span>
                        <span className="text-slate-300 mx-1.5">/</span>
                        <span className="text-rose-500 font-semibold">{weekStats.loss} Losses</span>
                      </td>
                      <td className={`py-3.5 px-4 font-mono font-bold ${weekStats.pnl >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {weekStats.pnl >= 0 ? "+" : ""}${weekStats.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Locked & Finalized
                          </span>
                        ) : linkedReview ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            Draft in Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                            <FileText className="w-3.5 h-3.5" />
                            No Review Prepared
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
