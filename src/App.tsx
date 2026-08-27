import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Sparkles, 
  Layers, 
  Search, 
  AlertTriangle, 
  ShieldAlert, 
  BookOpen, 
  Trash2, 
  HelpCircle, 
  Terminal, 
  SlidersHorizontal,
  Plus,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Requirement } from './types';
import UploadSection from './components/UploadSection';
import AIPromptGenerator from './components/AIPromptGenerator';
import RequirementDetails from './components/RequirementDetails';
import BatchScanner from './components/BatchScanner';

const PRELOADED_REQS: Requirement[] = [
  {
    id: "REQ-01",
    title: "PAY-01: Cryptographic Protection",
    text: "The system must encrypt all patient card numbers and transaction values using military-grade security standard encryption keys prior to writing them into the database.",
    classification: "Security",
    score: 85,
    isVerifiable: true,
    ambiguitiesCount: 1,
    decompositionCount: 2
  },
  {
    id: "REQ-02",
    title: "PAY-02: Transaction Processing Speed",
    text: "Credit card processing must be super fast and efficient so that users do not experience any delay.",
    classification: "Performance",
    score: 55,
    isVerifiable: false,
    ambiguitiesCount: 2,
    decompositionCount: 2
  },
  {
    id: "REQ-03",
    title: "EV-02: Max Power Output Limit",
    text: "The maximum power output delivered by any single residential charger node shall be restricted to a peak limit of 22 kW.",
    classification: "Functional",
    score: 95,
    isVerifiable: true,
    ambiguitiesCount: 0,
    decompositionCount: 1
  },
  {
    id: "REQ-04",
    title: "EV-04: Peak Charging Safety Threshold",
    text: "During standard state grid peak conditions, the maximum charging power delivery of any charger node must never exceed 11 kW.",
    classification: "Functional",
    score: 88,
    isVerifiable: true,
    ambiguitiesCount: 0,
    decompositionCount: 1
  }
];

export default function App() {
  const [requirements, setRequirements] = useState<Requirement[]>(PRELOADED_REQS);
  const [selectedReqId, setSelectedReqId] = useState<string | null>("REQ-02");
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Low' | 'Non-Verifiable' | 'Security' | 'Performance'>('All');
  
  const [isSystemLoading, setIsSystemLoading] = useState(false);
  const [isAnalyzingSingle, setIsAnalyzingSingle] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState({ active: false, hasApiKey: false });
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [showIngestionPanel, setShowIngestionPanel] = useState(true);

  // Check backend server status & API key state on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setServerStatus({ active: true, hasApiKey: data.hasApiKey });
      })
      .catch(() => {
        setServerStatus({ active: false, hasApiKey: false });
      });
  }, []);

  const handleRequirementsLoaded = (newReqs: { title: string; text: string }[]) => {
    const formatted = newReqs.map((r, idx) => ({
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      title: r.title,
      text: r.text,
      classification: 'Unclassified',
      score: 0,
      isVerifiable: true,
      ambiguitiesCount: 0,
      decompositionCount: 0
    }));

    setRequirements(prev => [...formatted, ...prev]);
    if (formatted.length > 0) {
      setSelectedReqId(formatted[0].id);
    }
  };

  const handleAnalyzeSingle = async (reqId: string) => {
    const req = requirements.find(r => r.id === reqId);
    if (!req) return;

    setIsAnalyzingSingle(true);
    setSystemError(null);
    try {
      const response = await fetch('/api/analyze-requirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: req.title, text: req.text }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze requirement.');
      }

      const analysis = data.analysis;
      setRequirements(prev => prev.map(item => {
        if (item.id === reqId) {
          return {
            ...item,
            classification: analysis.classification,
            score: analysis.score,
            isVerifiable: analysis.isVerifiable,
            ambiguitiesCount: analysis.ambiguities.length,
            decompositionCount: analysis.decomposedStatements.length,
            analysis
          };
        }
        return item;
      }));
    } catch (err: any) {
      setSystemError(err.message || 'Error occurred during requirement analysis.');
    } finally {
      setIsAnalyzingSingle(false);
    }
  };

  const handleApplyImprovement = (reqId: string, improvedText: string) => {
    setRequirements(prev => prev.map(item => {
      if (item.id === reqId) {
        const updated = {
          ...item,
          text: improvedText,
          // Reset analysis metrics since content changed so they can re-analyze
          score: 0,
          ambiguitiesCount: 0,
          analysis: undefined
        };
        return updated;
      }
      return item;
    }));
    setSystemError("Statement updated! Click 'Trigger AI Deep Scan' to analyze the new formulation.");
    setTimeout(() => setSystemError(null), 5000);
  };

  const handleHighlightConflict = (ids: string[]) => {
    setHighlightedIds(ids);
    // Auto select the first one to inspect
    if (ids.length > 0) {
      setSelectedReqId(ids[0]);
    }
    // Remove highlight pulse after 6 seconds
    setTimeout(() => {
      setHighlightedIds([]);
    }, 6000);
  };

  const deleteRequirement = (id: string) => {
    setRequirements(prev => prev.filter(r => r.id !== id));
    if (selectedReqId === id) {
      setSelectedReqId(null);
    }
  };

  const clearWorkspace = () => {
    setRequirements([]);
    setSelectedReqId(null);
  };

  // Pre-load default analyses for initial preloaded requirements to look highly aesthetic out of the box
  useEffect(() => {
    // Run automated fast analyze on preloaded REQ-02 so it displays gorgeous content immediately
    if (requirements.length > 0 && !requirements[0].analysis) {
      handleAnalyzeSingle("REQ-02");
    }
  }, []);

  const selectedRequirement = requirements.find(r => r.id === selectedReqId);

  // Filters and search logic
  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          req.text.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterType === 'All') return true;
    if (filterType === 'Low') return req.score > 0 && req.score < 70;
    if (filterType === 'Non-Verifiable') return !req.isVerifiable;
    if (filterType === 'Security') return req.classification === 'Security';
    if (filterType === 'Performance') return req.classification === 'Performance';
    return true;
  });

  return (
    <div id="main-application" className="min-h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col antialiased relative overflow-hidden">
      {/* Dynamic Frosted Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#312e81,_transparent_45%),_radial-gradient(circle_at_bottom_left,_#1e1b4b,_transparent_45%)] opacity-70 pointer-events-none z-0" />

      {/* Top Navigation Bar */}
      <header id="app-header" className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50 px-6 py-4 relative z-10">
        <div className="max-w-[1430px] w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Requirements Intelligence
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Requirements Engineering & Verification Agent</p>
            </div>
          </div>

          {/* API connection indicator status */}
          <div className="flex items-center gap-3">
            {serverStatus.active ? (
              serverStatus.hasApiKey ? (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-indigo-200 font-semibold shadow-inner">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>Gemini API Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-amber-200 font-semibold">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Sandbox Run (Mock fallback enabled)</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-slate-400 font-semibold">
                <span className="inline-block w-2 h-2 rounded-full bg-slate-500"></span>
                <span>Offline</span>
              </div>
            )}

            <button
              onClick={() => setShowIngestionPanel(!showIngestionPanel)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              {showIngestionPanel ? 'Hide Ingestion Controls' : 'Show Ingestion Controls'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1430px] w-full mx-auto p-4 md:p-6 space-y-6 relative z-10">
        
        {systemError && (
          <div className="bg-white/5 backdrop-blur-xl border border-blue-500/30 text-blue-200 p-3.5 rounded-xl text-xs flex gap-2.5 items-center">
            <HelpCircle className="w-4.5 h-4.5 shrink-0 text-blue-300" />
            <span className="flex-1">{systemError}</span>
            <button onClick={() => setSystemError(null)} className="text-[10px] text-slate-400 hover:text-slate-200 uppercase font-semibold">Dismiss</button>
          </div>
        )}

        {/* Collapsible File Ingestion / AI Generation Dashboard */}
        <AnimatePresence>
          {showIngestionPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-6"
            >
              {/* File Import, Sync & Manual Ingestion */}
              <UploadSection 
                onRequirementsLoaded={handleRequirementsLoaded}
                isLoading={isSystemLoading}
                setIsLoading={setIsSystemLoading}
                onError={(msg) => setSystemError(msg)}
              />

              {/* AI synthesis generator */}
              <AIPromptGenerator
                onRequirementsGenerated={handleRequirementsLoaded}
                isLoading={isSystemLoading}
                setIsLoading={setIsSystemLoading}
                onError={(msg) => setSystemError(msg)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Requirements Explorer Split Workspace */}
        <div id="split-workspace-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Explorer Board */}
          <div id="left-explorer-board" className="lg:col-span-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg flex flex-col h-[650px] overflow-hidden">
            
            {/* Board Header & Filters */}
            <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Specification Workspace</span>
                  <span className="bg-black/20 text-indigo-200 border border-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    {requirements.length} rows
                  </span>
                </div>
                {requirements.length > 0 && (
                  <button
                    onClick={clearWorkspace}
                    className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none"
                  >
                    <Trash2 className="w-3 h-3" />
                    Wipe Workspace
                  </button>
                )}
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search statements or IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full glass-input rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                {(['All', 'Low', 'Non-Verifiable', 'Security', 'Performance'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                      filterType === tab 
                        ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold' 
                        : 'bg-transparent text-slate-400 hover:text-slate-200'
                     }`}
                  >
                    {tab === 'Low' ? 'Needs Review (<70)' : tab === 'Non-Verifiable' ? 'Non-Verifiable' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Explorer List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredRequirements.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <BookOpen className="w-8 h-8 text-slate-500" />
                  <p>No specifications loaded in workspace matching filters.</p>
                  <p className="text-[10px] text-slate-500">Import files above or click manual entry.</p>
                </div>
              ) : (
                filteredRequirements.map((req) => {
                  const isSelected = req.id === selectedReqId;
                  const isHighlighted = highlightedIds.includes(req.id);

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReqId(req.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-indigo-500/10 border-indigo-500/30 shadow-sm' 
                          : 'bg-white/5 hover:bg-white/10 border-transparent'
                      } ${isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0F172A] animate-pulse' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono text-[10px] font-semibold text-slate-200 bg-black/20 border border-white/10 px-1.5 py-0.2 rounded">
                            {req.title.split(':')[0]}
                          </span>
                          <h4 className="text-[11px] font-semibold text-slate-200 truncate">
                            {req.title.includes(':') ? req.title.split(':').slice(1).join(':').trim() : req.title}
                          </h4>
                        </div>

                        {/* Badges/Indicators */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {req.score > 0 && (
                            <span className={`text-[10px] font-bold font-mono px-1.5 rounded-full ${
                              req.score >= 80 ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                              req.score >= 60 ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                              'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                            }`}>
                              {req.score}%
                            </span>
                          )}
                          {!req.isVerifiable && (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" title="Non-verifiable statement" />
                          )}
                          {req.ambiguitiesCount > 0 && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" title={`${req.ambiguitiesCount} vague parameters`} />
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {req.text}
                      </p>

                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="bg-black/20 px-1.5 py-0.2 rounded border border-white/5">
                          {req.classification || 'Pending Analysis'}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRequirement(req.id);
                            }}
                            className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer bg-transparent border-none p-0"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Deep Intelligence Details */}
          <div id="right-intelligence-panel" className="lg:col-span-7 h-[650px] overflow-y-auto pr-1">
            {selectedRequirement ? (
              <div className="space-y-4">
                {/* Score Banner or Trigger Scanning Option */}
                {(!selectedRequirement.analysis) && (
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center space-y-4 shadow-lg">
                    <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 mb-1">
                      <Terminal className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">Awaiting AI Requirement Scan</h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                        This requirement has not been analyzed yet. Run full Gemini scanning to extract scores, vagueness lists, Gherkin scenarios, and decomposed rules.
                      </p>
                    </div>

                    <button
                      onClick={() => handleAnalyzeSingle(selectedRequirement.id)}
                      disabled={isAnalyzingSingle}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 text-white rounded-lg px-5 py-2 text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                    >
                      {isAnalyzingSingle ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Running analysis...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Trigger AI Deep Scan
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Loading state */}
                {isAnalyzingSingle && (
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-lg">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-xs text-slate-200 font-medium">Running advanced structural parsing with Gemini Model...</p>
                    <p className="text-[10px] text-slate-400">Extracting atomic decompositions, quantifying vague qualifiers, and structuring tests</p>
                  </div>
                )}

                {/* Display Full analysis if analyzed */}
                {!isAnalyzingSingle && selectedRequirement.analysis && (
                  <div className="space-y-4">
                    <RequirementDetails 
                      requirement={selectedRequirement} 
                      onApplyImprovement={handleApplyImprovement}
                    />

                    {/* Quick Recalibration Trigger */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleAnalyzeSingle(selectedRequirement.id)}
                        className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Re-Analyze Statement
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center text-slate-400 text-xs">
                Select a software specification requirement from the panel to run automated structural validation and quality scoring.
              </div>
            )}
          </div>
        </div>

        {/* Global Batch Integrity Analyzer (Duplicates and Conflicts) */}
        <BatchScanner 
          requirements={requirements}
          onHighlightConflict={handleHighlightConflict}
          onError={(msg) => setSystemError(msg)}
        />
        
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 mt-12 py-6 px-6 relative z-10 backdrop-blur-md">
        <div className="max-w-[1430px] w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© 2026 Requirements Intelligence Sandbox. Built for rigorous software design & safety verification.</p>
          <div className="flex gap-4">
            <span className="text-indigo-300 font-mono">Status: Green 3.5-Flash Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
