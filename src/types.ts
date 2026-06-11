/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  asset: string; // e.g., "EURUSD", "BTC", "AAPL"
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  pnl: number; // Profit or loss in dollars/account-currency
  outcome: "WIN" | "LOSS" | "BREAKEVEN";
  image?: string; // Base64 representation of the chart screenshot
  week: string; // e.g., "Week 1", "Week 2", "Week 3", etc.
  comments: string; // Opinions on what I did & what I can do better
}

export interface WeeklyReview {
  week: string; // e.g., "Week 1", "Week 2"
  winningTradeTakeAgain: "YES" | "NO" | "";
  // Winning YES questions
  winningYesExecution: string;
  winningYesManagement: string;
  winningYesRepeat: string;
  // Winning NO questions
  winningNoDeviation: string;
  winningNoAvoided: string;
  winningNoIncorrect: string;

  losingTradeTakeAgain: "YES" | "NO" | "";
  // Losing YES questions
  losingYesAvoidLoss: string;
  losingYesWellDone: string;
  losingYesEmotions: string;
  // Losing NO questions
  losingNoDeviation: string;
  losingNoWarning: string;
  losingNoImpact: string;

  // Overall Performance questions
  overallMissedTrade: string;
  overallDifferentThisWeek: string;
  overallBetterExecution: string;
  overallMindsetImpact: string;
  overallNextWeekActions: string;

  // Repeating strengths
  strengthCause: string;
  strengthPurpose: string;
  strengthAction: string;

  // Repeating mistakes
  mistakeCause: string;
  mistakePurpose: string;
  mistakeAction: string;

  isCompleted: boolean;
  updatedAt: string;
}

export interface BacktestDrill {
  id: string;
  date: string; // YYYY-MM-DD
  modelName: string; // The model being trained
  ltpImage?: string; // Long Term Perspective screenshot
  ltpNote: string; // LTP bias / what price should do next
  itpImage?: string; // Intermediate Term Perspective screenshot
  itpNote: string; // ITP supporting analysis
  stpImage?: string; // Short Term Perspective screenshot
  stpNote: string; // STP entry criteria
  createdAt: string; // ISO string
}

export interface BacktestDayStatus {
  date: string; // YYYY-MM-DD
  target: number;
  completed: number;
  failed: boolean;
}
