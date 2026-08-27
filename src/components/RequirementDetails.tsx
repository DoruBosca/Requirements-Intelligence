import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, AlertTriangle, CheckSquare, Layers, CornerDownRight, Check, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Requirement, RequirementAnalysis } from '../types';

interface RequirementDetailsProps {
  requirement: Requirement;
  onApplyImprovement: (reqId: string, improvedText: string) => void;
}

export default function RequirementDetails({ requirement, onApplyImprovement }: RequirementDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ambiguities' | 'criteria' | 'decomposition'>('overview');
  const [showImproved, setShowImproved] = useState(false);

  if (!requirement.analysis) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center text-slate-400 text-xs relative z-10">
        Select a requirement from the side panel and trigger AI Analysis to inspect comprehensive intelligence reports.
      </div>
    );
  }

  const analysis: RequirementAnalysis = requirement.analysis;

  // Progress circular indicator score
  const scoreColor = analysis.score >= 80 ? 'text-emerald-400' : analysis.score >= 60 ? 'text-amber-400' : 'text-rose-400';
  const scoreBg = analysis.score >= 80 ? 'stroke-emerald-950/30' : analysis.score >= 60 ? 'stroke-amber-950/30' : 'stroke-rose-950/30';
  const scoreStroke = analysis.score >= 80 ? 'stroke-emerald-400' : analysis.score >= 60 ? 'stroke-amber-400' : 'stroke-rose-400';

  // Circular progress helper
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (analysis.score / 100) * circumference;

  return (
    <div id="requirement-details-panel" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-6 relative z-10">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono text-xs font-semibold text-slate-200 bg-black/30 border border-white/10 px-2 py-0.5 rounded">
              {requirement.id}
            </span>
            <span className="text-[11px] uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
              {analysis.classification}
            </span>
            {analysis.isVerifiable ? (
              <span className="text-[11px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verifiable
              </span>
            ) : (
              <span className="text-[11px] uppercase font-bold tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Non-Verifiable
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold text-white leading-snug">
            {requirement.title.split(':').pop()?.trim()}
          </h2>
        </div>

        {/* Big Circular Score */}
        <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-white/10 shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className={`fill-none stroke-2 ${scoreBg}`}
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                className={`fill-none stroke-2 transition-all duration-1000 ease-out ${scoreStroke}`}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-sm font-bold font-mono ${scoreColor}`}>
              {analysis.score}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quality Score</span>
            <span className="text-xs font-bold text-slate-200">
              {analysis.score >= 80 ? 'Excellent Spec' : analysis.score >= 60 ? 'Needs Improvement' : 'Vague & Non-Testable'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex border-b border-white/10 gap-4 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-1 font-medium transition-colors cursor-pointer relative ${
            activeTab === 'overview' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview & Improvements
          {activeTab === 'overview' && (
            <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ambiguities')}
          className={`pb-2 px-1 font-medium transition-colors cursor-pointer relative flex items-center gap-1 ${
            activeTab === 'ambiguities' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ambiguities
          {analysis.ambiguities.length > 0 && (
            <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {analysis.ambiguities.length}
            </span>
          )}
          {activeTab === 'ambiguities' && (
            <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('criteria')}
          className={`pb-2 px-1 font-medium transition-colors cursor-pointer relative ${
            activeTab === 'criteria' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Acceptance Criteria
          {analysis.missingAcceptanceCriteria.length > 0 && (
            <span className="bg-white/10 text-indigo-200 text-[10px] font-mono px-1.5 py-0.2 rounded">
              {analysis.missingAcceptanceCriteria.length}
            </span>
          )}
          {activeTab === 'criteria' && (
            <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('decomposition')}
          className={`pb-2 px-1 font-medium transition-colors cursor-pointer relative ${
            activeTab === 'decomposition' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Decomposition
          {activeTab === 'decomposition' && (
            <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div id="details-tab-contents">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-5"
            >
              {/* Core Text & Improved Diff Compare */}
              <div className="bg-black/30 rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statement Sandbox</span>
                  <button
                    onClick={() => setShowImproved(!showImproved)}
                    className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-md text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-indigo-400" />
                    Show {showImproved ? 'Original' : 'Improved Option'}
                  </button>
                </div>

                <div className="min-h-[50px] relative">
                  {!showImproved ? (
                    <div className="text-xs text-slate-200 font-sans leading-relaxed">
                      {requirement.text}
                    </div>
                  ) : (
                    <div className="text-xs text-indigo-200 font-sans leading-relaxed bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20">
                      {analysis.suggestedImprovements[0]?.suggested || requirement.text}
                    </div>
                  )}
                </div>

                {showImproved && analysis.suggestedImprovements[0] && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-indigo-300 font-bold">Why this rewrite is superior:</p>
                      <p className="text-[12px] text-slate-300 mt-0.5">{analysis.suggestedImprovements[0].explanation}</p>
                      <button
                        onClick={() => onApplyImprovement(requirement.id, analysis.suggestedImprovements[0].suggested)}
                        className="mt-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-lg shadow-indigo-600/20"
                      >
                        <Check className="w-3 h-3" />
                        Apply & Rewrite Statement
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quality Criteria Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(analysis.scores).map(([key, val]) => (
                  <div key={key} className="bg-black/20 border border-white/5 p-3 rounded-xl">
                    <span className="block text-[11px] text-slate-400 font-semibold capitalize tracking-wider">{key}</span>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-sm font-bold font-mono text-slate-200">{val}</span>
                      <span className="text-[11px] text-slate-500">/100</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-indigo-500`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Non-Verifiable Alert */}
              {!analysis.isVerifiable && analysis.nonVerifiableReason && (
                <div className="bg-rose-950/20 border border-rose-900/30 text-rose-300 p-3.5 rounded-xl text-xs flex gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-rose-300">Non-Verifiable Spec Warning</h5>
                    <p className="text-slate-200 mt-1 text-[12px] leading-relaxed">{analysis.nonVerifiableReason}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ambiguities' && (
            <motion.div
              key="ambiguities"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              {analysis.ambiguities.length === 0 ? (
                <div className="p-5 border border-white/10 rounded-xl bg-black/20 text-center text-slate-400 text-xs">
                  Zero ambiguous terms or vague phrasing detected. Great precision!
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.ambiguities.map((amb, idx) => (
                    <div key={idx} className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          "{amb.term}"
                        </span>
                        <span className="text-[11px] text-slate-400">Unquantifiable Quality Attribute</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed pl-1">
                        <strong>Review:</strong> {amb.explanation}
                      </p>
                      {amb.suggestions.length > 0 && (
                        <div className="pl-1 space-y-1">
                          <p className="text-[11px] font-semibold text-slate-400">Engineering Recommendation:</p>
                          {amb.suggestions.map((sug, sIdx) => (
                            <div key={sIdx} className="text-[12px] text-indigo-300 flex items-center gap-1 font-sans">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                              <span>{sug}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'criteria' && (
            <motion.div
              key="criteria"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Missing Acceptance Criteria & Test Scenarios
                </h4>
              </div>

              {analysis.missingAcceptanceCriteria.length === 0 ? (
                <div className="p-5 border border-white/10 rounded-xl bg-black/20 text-center text-slate-400 text-xs">
                  No missing acceptance criteria identified.
                </div>
              ) : (
                <div className="space-y-2">
                  {analysis.missingAcceptanceCriteria.map((crit, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-black/20 border border-white/5 flex items-start gap-2">
                      <span className="text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded font-mono px-1.5 shrink-0 mt-0.5">
                        TC-{idx+1}
                      </span>
                      <p className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-line select-text">
                        {crit}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'decomposition' && (
            <motion.div
              key="decomposition"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
                  Atomic Statements Decomposition
                </h4>
              </div>
              <p className="text-[12px] text-slate-400">
                Compound requirements should be broken into discrete specifications. These atomic statements are fully testable and isolate system components cleanly.
              </p>

              {analysis.decomposedStatements.length === 0 ? (
                <div className="p-5 border border-white/10 rounded-xl bg-black/20 text-center text-slate-400 text-xs">
                  This requirement is already atomic. No decomposition required.
                </div>
              ) : (
                <div className="space-y-2 pl-1.5 border-l-2 border-indigo-500/20">
                  {analysis.decomposedStatements.map((dec, idx) => (
                    <div key={idx} className="flex items-start gap-2 py-1">
                      <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">{dec}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
