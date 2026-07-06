import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, Database, Plus, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Project {
  id: string;
  name: string;
  count: number;
}

interface UploadSectionProps {
  onRequirementsLoaded: (reqs: { title: string; text: string }[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onError: (msg: string) => void;
}

export default function UploadSection({ onRequirementsLoaded, isLoading, setIsLoading, onError }: UploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualText, setManualText] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch internal API mock projects on mount
  useEffect(() => {
    fetch('/api/internal-tool/projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
      })
      .catch(() => {
        onError("Could not fetch remote projects from internal API.");
      });
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse requirements file.');
      }

      if (data.requirements && data.requirements.length > 0) {
        onRequirementsLoaded(data.requirements);
        setApiSuccess(`Successfully parsed ${data.requirements.length} requirements from "${file.name}"`);
        setTimeout(() => setApiSuccess(null), 5000);
      } else {
        throw new Error('No requirements could be extracted from this file.');
      }
    } catch (err: any) {
      onError(err.message || 'Error occurred while loading file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFromAPI = async () => {
    if (!selectedProjectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/internal-tool/projects/${selectedProjectId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync with API.');
      }
      if (data.requirements && data.requirements.length > 0) {
        onRequirementsLoaded(data.requirements);
        setApiSuccess(`Synced ${data.requirements.length} specifications from project "${data.name}"`);
        setTimeout(() => setApiSuccess(null), 5000);
      } else {
        throw new Error('This project has no specifications.');
      }
    } catch (err: any) {
      onError(err.message || 'Could not fetch data from internal API spec server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    const title = manualTitle.trim() || `REQ-MANUAL-${Math.floor(100 + Math.random() * 900)}`;
    onRequirementsLoaded([{ title, text: manualText.trim() }]);
    setManualTitle('');
    setManualText('');
    setApiSuccess('Manual requirement added successfully.');
    setTimeout(() => setApiSuccess(null), 3000);
  };

  const handleAddBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    if (lines.length === 0) return;

    const parsed = lines.map((line, idx) => {
      // Intelligently check if user supplied a custom ID/title (e.g. REQ-01: text)
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0 && colonIndex < 30) {
        return {
          title: line.substring(0, colonIndex).trim(),
          text: line.substring(colonIndex + 1).trim()
        };
      }
      return {
        title: `REQ-${Math.floor(100 + Math.random() * 900)}`,
        text: line
      };
    });

    onRequirementsLoaded(parsed);
    setBulkText('');
    setApiSuccess(`Added ${parsed.length} bulk requirements.`);
    setTimeout(() => setApiSuccess(null), 3000);
  };

  return (
    <div id="upload-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
      {/* File Ingestion & Drag/Drop Card */}
      <div id="file-upload-card" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-indigo-400" />
            File Ingestion
          </h3>
          <p className="text-xs text-slate-300 mb-4">
            Upload document files containing requirement lists. We extract, clean up, and formulate statements automatically.
          </p>

          <div
            id="drag-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 bg-black/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.xlsx,.xls"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 bg-white/5 rounded-full text-slate-300">
                <FileSpreadsheet className="w-6 h-6 text-indigo-400 inline-block mr-1" />
                <span className="text-slate-500">/</span>
                <FileText className="w-6 h-6 text-amber-400 inline-block ml-1" />
              </div>
              <p className="text-xs text-slate-200 font-medium">
                Drag & drop or <span className="text-indigo-400 hover:underline">browse files</span>
              </p>
              <p className="text-[10px] text-slate-400">Excel (.xlsx, .xls) & PDF (.pdf) supported (Max 5MB)</p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 mt-4 text-xs text-indigo-300 bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20">
            <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            <span>Processing and extracting with Gemini model...</span>
          </div>
        )}
      </div>

      {/* Internal Tool API Sync Card */}
      <div id="api-sync-card" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-indigo-400" />
            Enterprise Tool Integrator (API)
          </h3>
          <p className="text-xs text-slate-300 mb-4">
            Simulate secure REST syncs with external repositories. Fetch raw features to run automated intelligence.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Enterprise Workspace</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose project API source --</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.count} specs)
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-[11px] text-slate-300">
              <span className="font-semibold text-slate-200">Endpoint:</span> <code className="text-indigo-300">GET /api/internal-tool/projects/:id</code>
              <div className="mt-1 flex items-center gap-2 text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                <span>Active Sandbox OAuth Token Validated</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleImportFromAPI}
          disabled={!selectedProjectId || isLoading}
          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-500 text-white rounded-lg py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Syncing specs...
            </>
          ) : (
            <>
              <Database className="w-3 h-3" />
              Establish API Sync Connection
            </>
          )}
        </button>
      </div>

      {/* Manual Input Methods Card */}
      <div id="manual-input-card" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
        <div className="flex border-b border-white/10 mb-3 text-xs">
          <span className="text-slate-200 font-semibold pb-2 border-b-2 border-indigo-400 px-1">
            Manual Entry Workspace
          </span>
        </div>

        <form onSubmit={handleAddManual} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <input
                type="text"
                placeholder="ID / Title"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 text-slate-200 placeholder-slate-500 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <input
                type="text"
                required
                placeholder="Enter single requirement statement..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 text-slate-200 placeholder-slate-500 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-lg py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Requirement Row
          </button>
        </form>

        <div className="mt-3">
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Bulk Paste (One per line)</span>
          <textarea
            rows={2}
            placeholder="Paste multiple statements here..."
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full bg-slate-950/50 border border-white/10 text-slate-200 placeholder-slate-500 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 resize-none font-mono"
          />
          <button
            onClick={handleAddBulk}
            disabled={!bulkText.trim()}
            className="w-full mt-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 disabled:bg-transparent disabled:text-slate-600 rounded-lg py-1.5 text-xs font-semibold transition-colors border border-indigo-500/20"
          >
            Parse Bulk Statements
          </button>
        </div>
      </div>

      {apiSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 lg:col-span-3 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-3 rounded-lg text-xs"
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{apiSuccess}</span>
        </motion.div>
      )}
    </div>
  );
}
