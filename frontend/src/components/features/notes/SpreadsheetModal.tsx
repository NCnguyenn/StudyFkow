'use client';

/**
 * SpreadsheetModal.tsx
 * Notion-like mini-spreadsheet for editing chart data.
 *
 * Features:
 * - Editable grid with input cells (headers + data rows)
 * - Add/remove rows and columns
 * - Collapsible CSV import for bulk paste
 * - Glassmorphic overlay with smooth animations
 * - Reads initial data from active dataChart node on open
 * - Writes back via editor.chain().updateAttributes()
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/core';
import { useEditorBlockStore } from '@/store/useEditorBlockStore';
import { X, Plus, Trash2, Upload } from 'lucide-react';

// ── Converters ───────────────────────────────────────────────────────────────

function dataToGrid(data: Record<string, string | number>[]): string[][] {
  if (!data || data.length === 0) return [['Category', 'Value'], ['Item 1', '100']];
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => String(row[h] ?? '')));
  return [headers, ...rows];
}

function gridToData(grid: string[][]): Record<string, string | number>[] {
  if (grid.length < 2) return [];
  const headers = grid[0];
  return grid.slice(1).map((row) => {
    const obj: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      const cell = (row[i] ?? '').trim();
      const num = Number(cell);
      obj[h || `col${i}`] = cell !== '' && !isNaN(num) ? num : cell;
    });
    return obj;
  });
}

// ── CSV Parser (inline to avoid circular deps) ──────────────────────────────

function parseCSVToGrid(raw: string): string[][] | null {
  const lines = raw.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;

  const isMarkdown = lines[0].trim().startsWith('|');
  let delimiter = ',';
  let cleanLines = lines;

  if (isMarkdown) {
    delimiter = '|';
    cleanLines = lines.filter((l) => !/^[\s|:\-]+$/.test(l));
  } else if (lines[0].includes('\t')) {
    delimiter = '\t';
  }

  const splitRow = (line: string): string[] => {
    let parts = line.split(delimiter).map((c) => c.trim());
    if (isMarkdown) {
      if (parts[0] === '') parts = parts.slice(1);
      if (parts[parts.length - 1] === '') parts = parts.slice(0, -1);
    }
    return parts;
  };

  const grid = cleanLines.map((line) => splitRow(line));
  return grid.length >= 2 ? grid : null;
}

// ── Component ────────────────────────────────────────────────────────────────

interface SpreadsheetModalProps {
  editor: Editor;
}

export const SpreadsheetModal: React.FC<SpreadsheetModalProps> = ({ editor }) => {
  const { spreadsheetOpen, setSpreadsheetOpen } = useEditorBlockStore();
  const [grid, setGrid] = useState<string[][]>([]);
  const [showCSV, setShowCSV] = useState(false);
  const [csvValue, setCsvValue] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  // ── Snapshot chart data when modal opens ─────────────────────────────────
  useEffect(() => {
    if (spreadsheetOpen) {
      const attrs = editor.getAttributes('dataChart');
      const data = attrs.chartData;
      setGrid(dataToGrid(data));
      setShowCSV(false);
      setCsvValue('');
      // Auto-focus first data cell
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [spreadsheetOpen, editor]);

  // ── Cell update ─────────────────────────────────────────────────────────
  const updateCell = useCallback((row: number, col: number, value: string) => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      if (!next[row]) next[row] = [];
      next[row][col] = value;
      return next;
    });
  }, []);

  // ── Row/Column management ───────────────────────────────────────────────
  const addRow = useCallback(() => {
    setGrid((prev) => {
      const cols = prev[0]?.length || 2;
      return [...prev, Array(cols).fill('')];
    });
  }, []);

  const addColumn = useCallback(() => {
    setGrid((prev) =>
      prev.map((row, i) => [...row, i === 0 ? `Col ${row.length}` : '']),
    );
  }, []);

  const deleteRow = useCallback((index: number) => {
    if (index === 0) return; // don't delete headers
    setGrid((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const deleteColumn = useCallback((index: number) => {
    setGrid((prev) => {
      if (prev[0]?.length <= 2) return prev; // keep at least 2 cols
      return prev.map((row) => row.filter((_, i) => i !== index));
    });
  }, []);

  // ── Apply ───────────────────────────────────────────────────────────────
  const handleApply = useCallback(() => {
    const data = gridToData(grid);
    if (data.length > 0) {
      editor.chain().updateAttributes('dataChart', { chartData: data }).run();
    }
    setSpreadsheetOpen(false);
  }, [grid, editor, setSpreadsheetOpen]);

  // ── CSV Import ──────────────────────────────────────────────────────────
  const handleImportCSV = useCallback(() => {
    const parsed = parseCSVToGrid(csvValue);
    if (parsed) {
      setGrid(parsed);
      setShowCSV(false);
    }
  }, [csvValue]);

  // ── Keyboard shortcut: Escape to close ──────────────────────────────────
  useEffect(() => {
    if (!spreadsheetOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSpreadsheetOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [spreadsheetOpen, setSpreadsheetOpen]);

  if (!spreadsheetOpen) return null;

  const headers = grid[0] || [];
  const dataRows = grid.slice(1);

  return (
    <div
      className="spreadsheet-overlay"
      onMouseDown={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) setSpreadsheetOpen(false);
      }}
    >
      <div
        className="spreadsheet-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📊</span>
            <h3 className="text-sm font-semibold text-slate-800">Edit Chart Data</h3>
            <span className="text-xs text-slate-400 font-medium">
              {dataRows.length} row{dataRows.length !== 1 ? 's' : ''} × {headers.length} col{headers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors shadow-sm"
            >
              Apply
            </button>
            <button
              onClick={() => setSpreadsheetOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        <div className="p-4 overflow-auto max-h-[60vh]">
          <div className="spreadsheet-grid">
            <table>
              <thead>
                <tr>
                  <th className="spreadsheet-row-num">#</th>
                  {headers.map((h, ci) => (
                    <th key={ci} className="spreadsheet-header-cell">
                      <input
                        value={h}
                        onChange={(e) => updateCell(0, ci, e.target.value)}
                        className="spreadsheet-input spreadsheet-input--header"
                        spellCheck={false}
                      />
                      {headers.length > 2 && (
                        <button
                          onClick={() => deleteColumn(ci)}
                          className="spreadsheet-del-col"
                          title="Delete column"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </th>
                  ))}
                  <th className="spreadsheet-action-col">
                    <button onClick={addColumn} className="spreadsheet-add-btn" title="Add column">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, ri) => (
                  <tr key={ri}>
                    <td className="spreadsheet-row-num">{ri + 1}</td>
                    {headers.map((_, ci) => (
                      <td key={ci} className="spreadsheet-cell">
                        <input
                          ref={ri === 0 && ci === 0 ? firstInputRef : undefined}
                          value={row[ci] ?? ''}
                          onChange={(e) => updateCell(ri + 1, ci, e.target.value)}
                          className="spreadsheet-input"
                          spellCheck={false}
                        />
                      </td>
                    ))}
                    <td className="spreadsheet-action-col">
                      {dataRows.length > 1 && (
                        <button
                          onClick={() => deleteRow(ri + 1)}
                          className="spreadsheet-del-row"
                          title="Delete row"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row */}
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/60 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>

        {/* ── CSV Import (collapsible) ────────────────────────────────────── */}
        <div className="px-5 pb-4 border-t border-slate-100 pt-3">
          <button
            onClick={() => setShowCSV(!showCSV)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {showCSV ? 'Hide CSV Import' : 'Paste CSV / Markdown Table'}
          </button>
          {showCSV && (
            <div className="mt-2 flex gap-2">
              <textarea
                value={csvValue}
                onChange={(e) => setCsvValue(e.target.value)}
                placeholder={'name,Revenue,Expenses\nJan,4200,2400\nFeb,3800,1398'}
                className="flex-1 h-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-300"
                spellCheck={false}
              />
              <button
                onClick={handleImportCSV}
                className="self-end px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Import
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
