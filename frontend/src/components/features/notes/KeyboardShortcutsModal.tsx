import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { keys: ['Ctrl', '/'], desc: 'Toggle this shortcuts modal' },
    { keys: ['Ctrl', 'Shift', 'R'], desc: 'Toggle Reading Mode' },
    { keys: ['Ctrl', 'Shift', 'F'], desc: 'Toggle Focus Spotlight (in Reading Mode)' },
    { keys: ['Ctrl', 'K'], desc: 'Omni-Search (Global)' },
    { keys: ['Ctrl', 'S'], desc: 'Save / Sync note (Auto-saves otherwise)' },
    { keys: ['/'], desc: 'Open Slash Command Menu (in Editor)' },
    { keys: ['[' , '['], desc: 'Open Bi-directional Link / Backlinks Menu' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Keyboard className="w-5 h-5 text-indigo-500" />
            <h3>Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-600">{s.desc}</span>
              <div className="flex items-center gap-1.5">
                {s.keys.map((k, i) => (
                  <React.Fragment key={i}>
                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500 shadow-sm min-w-[24px] text-center">
                      {k}
                    </kbd>
                    {i < s.keys.length - 1 && <span className="text-slate-300 text-xs">+</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-indigo-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
