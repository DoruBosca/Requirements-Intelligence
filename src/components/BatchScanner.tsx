import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, Copy, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Requirement, BatchAnalysisResult } from '../types';

interface BatchScannerProps {
  requirements: Requirement[];
  onHighlightConflict: (ids: string[]) => void;
  onError: (msg: string) => void;
}

export default function BatchScanner({ requirements, onHighlightConflict, onError }: BatchScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<BatchAnalysisResult | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  const runBatchScan = async () => {
    if (requirements.length < 2) {
      onError("Please import or enter at least 2 requirements before scanning for duplicates/conflicts.");
      return;
    }

    setIsScanning(true);
    setResults(null);
    try {
      const response = await fetch('/api/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: requirements.map(r => ({ id: r.id, title: r.title, text: r.text }))
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Batch scan failed.');
      }

      setResults(data.result);
      setHasScanned(true);
    } catch (err: any) {
      onError(err.message || 'Error occurred during batch analysis.');
    } finally {
      setIsScanning(false);
    }
  };

  const severityStyles = {
    High: 'bg-rose-950/20 border-rose-900/30 text-rose-300',
    Medium: 'bg-amber-950/20 border-amber-900/30 text-amber-300',
    Low: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
  };

  return (
    <div id="batch-scanner-panel" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg relative z-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-indigo-400" />
            Workspace Integrity Scanner
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Analyze the entire specification batch to detect redundancies, overlaps, and direct system contradictions.
          </p>
        </div>

        <button
          onClick={runBatchScan}
          disabled={isScanning || requirements.length < 2}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white disabled:opacity-40 disabled:hover:border-white/10 py-1.5 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning...' : 'Scan Duplicates & Conflicts'}
        </button>
      </div>

      {isScanning && (
        <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-black/20">
          <div className="inline-flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>AI cross-referencing {requirements.length} requirements...</span>
          </div>
        </div>
      )}

      {!isScanning && !hasScanned && (
        <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-black/10 text-slate-400 text-xs">
          {requirements.length < 2 ? (
            <p>Add at least 2 requirements to unlock duplicate and conflict detection.</p>
          ) : (
            <p>Click "Scan Duplicates & Conflicts" to run full-scope dependency checks.</p>
          )}
        </div>
      )}

      {hasScanned && results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
          {/* Conflicts Scanner Section */}
          <div id="conflicts-scanner-block" className="space-y-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Contradictions & Conflicts ({results.conflicts.length})
            </h4>

            {results.conflicts.length === 0 ? (
              <div className="p-4 rounded-xl bg-black/20 border border-white/10 text-slate-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero system conflicts or logical parameters clashes found in this batch!</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {results.conflicts.map((conf, idx) => (
                  <motion.div
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     key={idx}
                     className={`p-3.5 rounded-xl border flex flex-col gap-2 ${severityStyles[conf.severity] || severityStyles.Medium}`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-200 font-mono text-[10px] bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
                          {conf.req1Title}
                        </span>
                        <span className="text-slate-400 text-[10px]">vs</span>
                        <span className="text-slate-200 font-mono text-[10px] bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
                          {conf.req2Title}
                        </span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-bold">
                        {conf.severity} Severity
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-200">
                      {conf.explanation}
                    </p>

                    <button
                      onClick={() => onHighlightConflict([conf.req1Id, conf.req2Id])}
                      className="self-start text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Locate Conflict Pair in List
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Redundancies Section */}
          <div id="redundancies-scanner-block" className="space-y-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              Overlaps & Redundancies ({results.duplicates.length})
            </h4>

            {results.duplicates.length === 0 ? (
              <div className="p-4 rounded-xl bg-black/20 border border-white/10 text-slate-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero redundant requirements or high-overlap items detected!</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {results.duplicates.map((dup, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx}
                    className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-200 font-mono text-[10px] bg-black/20 px-1.5 py-0.5 rounded border border-white/5">
                          {dup.req1Title}
                        </span>
                        <span className="text-slate-400 text-[10px]">&</span>
                        <span className="text-slate-200 font-mono text-[10px] bg-black/20 px-1.5 py-0.5 rounded border border-white/5">
                          {dup.req2Title}
                        </span>
                      </div>
                      <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">
                        {dup.similarity}% overlap
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-200">
                      {dup.explanation}
                    </p>

                    <button
                      onClick={() => onHighlightConflict([dup.req1Id, dup.req2Id])}
                      className="self-start text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Locate Overlap Pair in List
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
