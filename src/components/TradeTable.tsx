import { useState, useRef, ChangeEvent, DragEvent, FormEvent, Fragment } from "react";
import { Trade } from "../types";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Image, Eye, Upload, Filter, Calendar, TrendingUp, Sparkles, X } from "lucide-react";

interface TradeTableProps {
  trades: Trade[];
  onAddTrade: (trade: Trade) => void;
  onUpdateTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
  allWeeks: string[];
}

export default function TradeTable({
  trades,
  onAddTrade,
  onUpdateTrade,
  onDeleteTrade,
  selectedWeek,
  setSelectedWeek,
  allWeeks,
}: TradeTableProps) {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Expanded notes rows State
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    week: selectedWeek === "All Weeks" ? "Week 1" : selectedWeek,
    asset: "",
    direction: "LONG" as "LONG" | "SHORT",
    entryPrice: "",
    exitPrice: "",
    pnl: "",
    outcome: "WIN" as "WIN" | "LOSS" | "BREAKEVEN",
    comments: "",
    image: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Filter Trades
  const filteredTrades = trades.filter(
    (t) => selectedWeek === "All Weeks" || t.week === selectedWeek
  );

  // Toggle rows
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Convert File to Base64
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Drag Events for Upload
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingTrade(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      week: selectedWeek === "All Weeks" ? "Week 1" : selectedWeek,
      asset: "",
      direction: "LONG",
      entryPrice: "",
      exitPrice: "",
      pnl: "",
      outcome: "WIN",
      comments: "",
      image: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (trade: Trade) => {
    setEditingTrade(trade);
    setFormData({
      date: trade.date,
      week: trade.week,
      asset: trade.asset,
      direction: trade.direction,
      entryPrice: trade.entryPrice.toString(),
      exitPrice: trade.exitPrice.toString(),
      pnl: trade.pnl.toString(),
      outcome: trade.outcome,
      comments: trade.comments,
      image: trade.image || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Parse numeric fields safely
    const entryPriceNum = parseFloat(formData.entryPrice) || 0;
    const exitPriceNum = parseFloat(formData.exitPrice) || 0;
    const pnlNum = parseFloat(formData.pnl) || 0;

    const newTradeData: Trade = {
      id: editingTrade ? editingTrade.id : crypto.randomUUID(),
      date: formData.date,
      week: formData.week,
      asset: formData.asset.trim().toUpperCase() || "UNKNOWN",
      direction: formData.direction,
      entryPrice: entryPriceNum,
      exitPrice: exitPriceNum,
      pnl: pnlNum,
      outcome: formData.outcome,
      comments: formData.comments.trim(),
      image: formData.image || undefined,
    };

    if (editingTrade) {
      onUpdateTrade(newTradeData);
    } else {
      onAddTrade(newTradeData);
    }

    setIsModalOpen(false);
  };

  return (
    <div id="trades-journal-manager" className="space-y-6">
      
      {/* 1. Filtering & Adding Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
        
        {/* Week Selector */}
        <div className="flex items-center gap-3">
          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Filter className="w-5 h-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Week Filter</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="text-sm font-semibold text-slate-700 bg-transparent border-none outline-none focus:ring-0 cursor-pointer p-0"
            >
              <option value="All Weeks">All Saved Weeks</option>
              {allWeeks.map((wk) => (
                <option key={wk} value={wk}>
                  {wk}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Entry Button */}
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 transition py-2.5 px-5 rounded-xl font-semibold text-sm shadow-sm"
        >
          <Plus className="w-4.5 h-4.5" />
          New Trade Log entry
        </button>
      </div>

      {/* 2. Visual Table View */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredTrades.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3 flex flex-col items-center max-w-sm mx-auto">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-600">No trades indexed for {selectedWeek}</p>
              <p className="text-xs text-slate-400 mt-1">
                Begin logging your executions to build the weekly tables and calculate win rate statistics.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2 px-4 rounded-xl transition"
            >
              Log First Setup
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  <th className="py-4 px-4 w-10"></th>
                  <th className="py-4 px-4">Date / Week</th>
                  <th className="py-4 px-4">Asset</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Entry / Exit</th>
                  <th className="py-4 px-4">Outcome</th>
                  <th className="py-4 px-4">Net Return ($)</th>
                  <th className="py-4 px-4">Outcome Picture</th>
                  <th className="py-4 px-4 text-center">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrades.map((trade) => {
                  const isExpanded = !!expandedRows[trade.id];
                  const hasNotes = trade.comments && trade.comments.trim() !== "";
                  
                  return (
                    <Fragment key={trade.id}>
                      {/* Standard row */}
                      <tr className="hover:bg-slate-50/40 transition">
                        {/* Toggle button */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => toggleRow(trade.id)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title={isExpanded ? "Collapse Notes" : "Expand Notes"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4">
                          <p className="font-semibold text-slate-800">{trade.date}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-wider">{trade.week}</p>
                        </td>

                        {/* Asset */}
                        <td className="py-4 px-4">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100/80 px-2 py-1 rounded text-xs border border-slate-200/50">
                            {trade.asset}
                          </span>
                        </td>

                        {/* Direction */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              trade.direction === "LONG"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-rose-50 text-rose-700 border border-rose-100"
                            }`}
                          >
                            {trade.direction === "LONG" ? "Buy" : "Sell"}
                          </span>
                        </td>

                        {/* Entry / Exit */}
                        <td className="py-4 px-4 font-mono text-xs">
                          <p className="text-slate-600">Entry: {trade.entryPrice}</p>
                          <p className="text-slate-400 mt-0.5">Exit: {trade.exitPrice}</p>
                        </td>

                        {/* Outcome Tag */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              trade.outcome === "WIN"
                                ? "bg-emerald-500 text-white"
                                : trade.outcome === "LOSS"
                                ? "bg-rose-500 text-white"
                                : "bg-slate-200 text-slate-700 font-medium"
                            }`}
                          >
                            {trade.outcome}
                          </span>
                        </td>

                        {/* Net Return */}
                        <td className={`py-4 px-4 font-mono font-bold text-xs ${trade.pnl >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Outcome Picture preview */}
                        <td className="py-4 px-4">
                          {trade.image ? (
                            <div className="relative group/img w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shadow-sm cursor-pointer"
                                 onClick={() => setLightboxImage(trade.image || null)}
                            >
                              <img src={trade.image} alt="Trade Shot" className="w-full h-full object-cover group-hover/img:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition duration-150">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg border border-dashed border-slate-200 flex items-center justify-center bg-slate-50/50" title="No uploaded chart">
                              <Image className="w-4 h-4 text-slate-300" />
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(trade)}
                              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition"
                              title="Edit Entry"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Remove trade record from the log?")) {
                                  onDeleteTrade(trade.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Notes Drawer */}
                      {isExpanded && (
                        <tr key={`${trade.id}-expanded`} className="bg-slate-50/30 border-l-4 border-blue-500">
                          <td colSpan={9} className="py-4 px-6">
                            <div className="flex flex-col md:flex-row gap-6">
                              {/* Opinions and reflection text */}
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h4 className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                    Execution Opinions & Reflection
                                  </h4>
                                  <p className="text-xs text-slate-400 mt-0.5">Opinions on what I did and what can be done better</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                  {hasNotes ? trade.comments : (
                                    <span className="text-slate-400 italic">No notes written. Edit this trade to add detailed reflections of what can be improved.</span>
                                  )}
                                </div>
                              </div>

                              {/* Highlighted miniature visual if uploaded */}
                              {trade.image && (
                                <div className="md:w-64 shrink-0 flex flex-col justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                  <div className="space-y-1 mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Setup Chart</span>
                                    <p className="text-xs text-slate-500 truncate">{trade.asset} - {trade.direction === "LONG" ? "Buy" : "Sell"}</p>
                                  </div>
                                  <img 
                                    src={trade.image} 
                                    onClick={() => setLightboxImage(trade.image || null)}
                                    alt="Setup Chart" 
                                    className="w-full h-32 object-cover rounded-lg border border-slate-100 cursor-zoom-in hover:opacity-90 transition shadow-sm" 
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Sliding / Center Modals (Log and edit entries) */}
      {isModalOpen && (
        <div id="trade-form-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl animate-scaleIn">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <div>
                <h3 className="text-xl font-display font-bold text-slate-800">
                  {editingTrade ? "Edit Trade Log" : "Log New Trade Entry"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Maintain consistency by feeding precise metric data into your calculations.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Primary Dimensions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800"
                  />
                </div>

                {/* Week */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trading Week</label>
                  <select
                    value={formData.week}
                    onChange={(e) => setFormData((p) => ({ ...p, week: e.target.value }))}
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800"
                  >
                    {allWeeks.map((wk) => (
                      <option key={wk} value={wk}>
                        {wk}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Asset Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asset / Pair</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EURUSD, BTC, NVDA"
                    value={formData.asset}
                    onChange={(e) => setFormData((p) => ({ ...p, asset: e.target.value }))}
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Price Actions Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-2 border-b border-slate-100">
                
                {/* Type/Direction with premium buttons */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Direction</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, direction: "LONG" }))}
                      className={`py-1.5 text-xs font-bold rounded-lg text-center transition ${
                        formData.direction === "LONG"
                          ? "bg-white text-emerald-600 shadow-sm border border-slate-100"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Long
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, direction: "SHORT" }))}
                      className={`py-1.5 text-xs font-bold rounded-lg text-center transition ${
                        formData.direction === "SHORT"
                          ? "bg-white text-rose-500 shadow-sm border border-slate-100"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Short
                    </button>
                  </div>
                </div>

                {/* Entry Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={formData.entryPrice}
                    onChange={(e) => setFormData((p) => ({ ...p, entryPrice: e.target.value }))}
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800"
                  />
                </div>

                {/* Exit Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exit Price</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={formData.exitPrice}
                    onChange={(e) => setFormData((p) => ({ ...p, exitPrice: e.target.value }))}
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800"
                  />
                </div>

                {/* Return PnL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Return P&L ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="+/- 0.00"
                    value={formData.pnl}
                    onChange={(e) => setFormData((p) => ({ ...p, pnl: e.target.value }))}
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Outcome status trigger */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outcome Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["WIN", "LOSS", "BREAKEVEN"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, outcome: opt }))}
                      className={`py-2.5 px-4 rounded-xl border font-bold text-xs transition uppercase ${
                        formData.outcome === opt
                          ? opt === "WIN"
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                            : opt === "LOSS"
                            ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                            : "bg-slate-700 border-slate-700 text-white shadow-sm"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opinions on what went well and what can be improved */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block"> Opinions & Reflections</label>
                <p className="text-[10px] text-slate-400">Opinions on what you did, and what you can do better next time.</p>
                <textarea
                  required
                  placeholder="What specifically did I do on this trade? Did I stick to rules? How can I improve my entry/management?"
                  value={formData.comments}
                  onChange={(e) => setFormData((p) => ({ ...p, comments: e.target.value }))}
                  className="w-full text-sm p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800"
                  rows={4}
                />
              </div>

              {/* Draggable Screenshot Drag-and-drop Image module */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Outcome Picture (Screenshot)</label>
                
                {formData.image ? (
                  <div className="relative border border-slate-200 rounded-2xl p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={formData.image} alt="Thumbnail preview" className="w-14 h-14 rounded-lg object-cover border border-slate-300" />
                      <div>
                        <span className="text-xs font-semibold text-slate-700">Setup Image Loaded</span>
                        <p className="text-[10px] text-slate-400">Compressed to local storage Base64</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, image: "" }))}
                      className="text-slate-400 hover:text-rose-500 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                      dragActive
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">Drag & drop your trade screenshot here</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">or click to browse from files</p>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-semibold text-sm"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition rounded-xl font-semibold text-sm shadow-sm"
                >
                  {editingTrade ? "Update Log" : "Log Trade Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Module */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <div className="max-w-4xl max-h-[85vh] relative animate-scaleIn select-none">
            <button 
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={lightboxImage} 
              alt="High-Res Setup Zoom" 
              className="rounded-xl max-w-full max-h-[85vh] object-contain border border-white/10 shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
