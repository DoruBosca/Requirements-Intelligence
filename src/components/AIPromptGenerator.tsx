import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface AIPromptGeneratorProps {
  onRequirementsGenerated: (reqs: { title: string; text: string }[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onError: (msg: string) => void;
}

const CONCEPTS = [
  "Biometric user authentication with JWT security",
  "High-throughput real-time payment settlement engine",
  "Offline-first sync module for a mobile health tracker",
  "GDPR delete-account automation flow with secure audits"
];

export default function AIPromptGenerator({ onRequirementsGenerated, isLoading, setIsLoading, onError }: AIPromptGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);

  const handleGenerate = async (selectedPrompt?: string) => {
    const activePrompt = selectedPrompt || prompt;
    if (!activePrompt.trim()) return;

    setIsLoading(true);
    setGeneratedCount(null);
    try {
      const response = await fetch('/api/generate-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: activePrompt }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate requirements');
      }

      if (data.requirements && data.requirements.length > 0) {
        onRequirementsGenerated(data.requirements);
        setGeneratedCount(data.requirements.length);
        if (!selectedPrompt) {
          setPrompt('');
        }
      } else {
        throw new Error('No requirements were generated.');
      }
    } catch (err: any) {
      onError(err.message || 'Error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-generator-panel" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg relative z-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
          AI Synthesis Engine
        </h3>
        <span className="text-[10px] bg-white/5 text-indigo-200 px-2 py-0.5 rounded-full font-medium border border-white/10">
          Powered by Gemini 3.5 Flash
        </span>
      </div>

      <p className="text-xs text-slate-300 mb-4">
        Synthesize fully testable, quantifiable, and verifiable software specifications from a high-level product concept.
      </p>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Describe your module, e.g. 'A subscription billing system with coupon code support'..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 bg-slate-950/50 border border-white/10 text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !prompt.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shrink-0 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                Synthesize
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Quick presets */}
        <div>
          <span className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-2">Or, try an expert sandbox seed:</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CONCEPTS.map((concept, idx) => (
              <button
                key={idx}
                onClick={() => handleGenerate(concept)}
                disabled={isLoading}
                className="text-left bg-slate-950/30 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg p-2.5 text-xs text-slate-300 hover:text-white transition-all flex justify-between items-center group cursor-pointer"
              >
                <span className="truncate pr-3">{concept}</span>
                <Sparkles className="w-3 h-3 text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {generatedCount !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-lg"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>Successfully synthesized <strong>{generatedCount}</strong> highly structured, verifiable requirements and loaded them into your workspace!</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
