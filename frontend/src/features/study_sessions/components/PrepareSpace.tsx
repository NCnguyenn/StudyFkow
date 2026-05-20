import React, { useState } from 'react';
import { useFocusStore, FOCUS_PRESETS } from '@/store/useFocusStore';
import { useTaskStore } from '@/store/useTaskStore';
import { Play, Settings2, Music, Target, RotateCcw } from 'lucide-react';

export const PrepareSpace = () => {
  const { 
    preset, 
    setPreset, 
    linkedTaskId, 
    setLinkedTask, 
    soundscape, 
    setSoundscape,
    isLoopMode,
    toggleLoopMode,
    startSession 
  } = useFocusStore();

  const { tasks } = useTaskStore();
  const availableTasks = tasks.filter(t => t.task_status !== 'COMPLETED' && t.task_status !== 'FAILED');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    startSession();
  };

  return (
    <div className="w-full max-w-lg mx-auto glass-card p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-light text-slate-800 tracking-widest mb-2">PREPARE SPACE</h2>
        <p className="text-sm text-slate-500 tracking-wider">Configure your ethereal focus environment.</p>
      </div>

      <form onSubmit={handleStart} className="space-y-6">
        
        {/* Preset Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 tracking-[0.2em] uppercase flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5" /> Time Preset
          </label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(FOCUS_PRESETS).filter(([k]) => k !== 'custom').map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`py-3 px-4 rounded-xl border transition-all duration-300 ${
                  preset.name === p.name 
                    ? 'bg-indigo-100 border-indigo-200 text-indigo-700 shadow-sm' 
                    : 'bg-white/50 border-slate-200 text-slate-500 hover:bg-white/80 hover:text-slate-700'
                }`}
              >
                <div className="font-medium text-sm">{p.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Task Linkage */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 tracking-[0.2em] uppercase flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> Connected Task
          </label>
          <select 
            value={linkedTaskId || ''} 
            onChange={(e) => setLinkedTask(e.target.value || null)}
            className="w-full glass-input px-4 py-3 text-sm"
          >
            <option value="">No task linked (Freestyle)</option>
            {availableTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {/* Soundscape */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 tracking-[0.2em] uppercase flex items-center gap-2">
            <Music className="w-3.5 h-3.5" /> Ambient Soundscape
          </label>
          <select 
            value={soundscape} 
            onChange={(e) => setSoundscape(e.target.value)}
            className="w-full glass-input px-4 py-3 text-sm"
          >
            <option value="rainy_cafe">Rainy Cafe</option>
            <option value="deep_lofi">Deep Lofi</option>
            <option value="nature">Nature Sounds</option>
            <option value="local">Local Upload (Offline DB)</option>
          </select>
        </div>

        {/* Loop Mode */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">Continuous Loop</span>
          </div>
          <button 
            type="button"
            onClick={toggleLoopMode}
            className={`w-12 h-6 rounded-full transition-colors relative ${isLoopMode ? 'bg-indigo-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isLoopMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <button 
          type="submit"
          className="w-full mt-6 py-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 border border-indigo-400 text-white font-medium tracking-widest shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3"
        >
          <Play className="w-5 h-5 fill-current" />
          ENTER DEEP FOCUS
        </button>

      </form>
    </div>
  );
};
