'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { X, Loader2, Share2, Eye, EyeOff } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api-utils';
import { useNoteStore } from '@/store/useNoteStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NodeGroup = 'subject' | 'task' | 'note';

interface GraphNode {
  id: string;
  name: string;
  val: number;
  group: NodeGroup;
  color: string;
  backlinks?: number;
  // injected by react-force-graph at runtime
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

interface RawGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface NetworkGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Lazy-load react-force-graph-2d (canvas lib — breaks SSR)
// ---------------------------------------------------------------------------

const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then((mod) => mod.default ?? mod),
  { ssr: false, loading: () => <GraphSkeleton /> },
);

const GraphSkeleton = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
  </div>
);

// ---------------------------------------------------------------------------
// Node radius lookup — maps group to canvas radius
// ---------------------------------------------------------------------------

const GROUP_RADIUS: Record<NodeGroup, number> = {
  subject: 12,
  task: 7,
  note: 4,
};

const GROUP_GLOW_COLOR: Record<NodeGroup, string> = {
  subject: 'rgba(139, 92, 246, 0.45)',
  task: 'rgba(99, 102, 241, 0.35)',
  note: 'rgba(148, 163, 184, 0.25)',
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const NetworkGraphModal: React.FC<NetworkGraphModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [rawData, setRawData] = useState<RawGraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Phase 6: Filter toggles
  const [showSubjects, setShowSubjects] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showNotes, setShowNotes] = useState(true);

  // Phase 6: Navigate on click
  const { setActiveNote } = useNoteStore();

  // Fetch graph data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const fetchGraph = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth('/notes/graph');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RawGraphData = await res.json();

        // Phase 6: Compute backlink counts for note nodes
        const backlinkCounts: Record<string, number> = {};
        data.links.forEach((link) => {
          const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
          backlinkCounts[targetId] = (backlinkCounts[targetId] || 0) + 1;
        });
        data.nodes.forEach((node) => {
          if (node.group === 'note') {
            node.backlinks = backlinkCounts[node.id] || 0;
            // Scale note val by backlinks (min 3, max 12)
            node.val = Math.min(12, Math.max(3, 3 + node.backlinks * 1.5));
          }
        });

        if (!cancelled) setRawData(data);
      } catch (err) {
        if (!cancelled) setError('Failed to load knowledge graph.');
        console.error('Graph fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGraph();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Resize observer for responsive canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Phase 6: Filtered graph data based on toggles
  const graphData = useMemo(() => {
    const visibleGroups = new Set<NodeGroup>();
    if (showSubjects) visibleGroups.add('subject');
    if (showTasks) visibleGroups.add('task');
    if (showNotes) visibleGroups.add('note');

    const filteredNodes = rawData.nodes.filter((n) => visibleGroups.has(n.group));
    const visibleIds = new Set(filteredNodes.map((n) => n.id));

    const filteredLinks = rawData.links.filter((l) => {
      const sourceId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const targetId = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return visibleIds.has(sourceId) && visibleIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [rawData, showSubjects, showTasks, showNotes]);

  // ── paintNode: multi-layer rendering by group ─────────────────────────────
  const paintNode = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode;
      if (typeof n.x !== 'number' || typeof n.y !== 'number' || isNaN(n.x) || isNaN(n.y)) {
        return;
      }

      const label = n.name || 'Untitled';
      const group: NodeGroup = n.group ?? 'note';
      const r = group === 'note' ? Math.min(8, Math.max(3, (n.val || 4))) : GROUP_RADIUS[group];
      const baseColor = n.color || '#94a3b8';
      const isHovered = hoveredNode?.id === n.id;
      const fontSize = Math.max(group === 'subject' ? 13 / globalScale : 11 / globalScale, 2.5);

      // ── Glow ring (subjects get a stronger glow, always; others on hover) ──
      if (group === 'subject' || isHovered) {
        const glowR = isHovered ? r * 2.4 : r * 2;
        const glowColor = GROUP_GLOW_COLOR[group];
        const gradient = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, glowR);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // ── Main node circle ───────────────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = isHovered ? lighten(baseColor, 0.15) : baseColor;
      ctx.fill();

      // ── Outline ────────────────────────────────────────────────────────────
      if (group !== 'note') {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = group === 'subject' ? 1.5 : 1;
        ctx.stroke();
      }

      // ── Label (suppress for note leaves unless hovered, for performance) ───
      const showLabel = group === 'subject' || group === 'task' || isHovered;
      if (showLabel) {
        ctx.font = `${group === 'subject' ? 'bold ' : ''}${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        // shadow for legibility
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 3;
        ctx.fillStyle = group === 'subject' ? '#f8fafc' : '#e2e8f0';
        const maxLabelLen = 24;
        const displayLabel = label.length > maxLabelLen ? label.slice(0, maxLabelLen) + '…' : label;
        ctx.fillText(displayLabel, n.x, n.y + r + 3);
        ctx.shadowBlur = 0;
      }
    },
    [hoveredNode],
  );

  const nodePointerAreaPaint = useCallback(
    (node: object, color: string, ctx: CanvasRenderingContext2D) => {
      const n = node as GraphNode;
      if (typeof n.x !== 'number' || typeof n.y !== 'number' || isNaN(n.x) || isNaN(n.y)) {
        return;
      }
      const r = GROUP_RADIUS[n.group ?? 'note'] + 4; // generous hit area
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [],
  );

  const handleNodeHover = useCallback((node: object | null, previousNode: object | null) => {
    setHoveredNode(node as GraphNode | null);
  }, []);

  // Phase 6: Click to navigate
  const handleNodeClick = useCallback((node: object) => {
    const n = node as GraphNode;
    if (n.group === 'note') {
      setActiveNote(n.id);
      onClose();
    }
    // For tasks and subjects, we could navigate to their respective pages
    // but for now just close the modal for notes only
  }, [setActiveNote, onClose]);

  if (!isOpen) return null;

  const subjectCount = rawData.nodes.filter(n => n.group === 'subject').length;
  const taskCount = rawData.nodes.filter(n => n.group === 'task').length;
  const noteCount = rawData.nodes.filter(n => n.group === 'note').length;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative z-[9999] w-[90vw] max-w-5xl h-[80vh] rounded-2xl border border-slate-700/50 bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-indigo-900/30 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-100">Knowledge Graph</h2>
            {!loading && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                  {subjectCount} subjects
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  {taskCount} tasks
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
                  {noteCount} notes
                </span>
                <span className="text-slate-600">· {graphData.links.length} links</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase 6: Filter Legend */}
        {!loading && !error && graphData.nodes.length > 0 && (
          <div className="flex items-center gap-3 px-6 py-2.5 border-b border-slate-800/60 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Filter</span>
            <FilterToggle
              label="Subjects"
              color="#8b5cf6"
              active={showSubjects}
              count={subjectCount}
              onClick={() => setShowSubjects(!showSubjects)}
            />
            <FilterToggle
              label="Tasks"
              color="#6366f1"
              active={showTasks}
              count={taskCount}
              onClick={() => setShowTasks(!showTasks)}
            />
            <FilterToggle
              label="Notes"
              color="#94a3b8"
              active={showNotes}
              count={noteCount}
              onClick={() => setShowNotes(!showNotes)}
            />
          </div>
        )}

        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 relative">
          {loading ? (
            <GraphSkeleton />
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Share2 className="w-12 h-12 text-slate-600" />
              <p className="text-sm text-slate-500">
                No notes linked yet. Use <code className="px-1.5 py-0.5 bg-slate-800 rounded text-indigo-400 text-xs">[[Note Title]]</code> to create connections.
              </p>
            </div>
          ) : (
            <>
              <ForceGraph2D
                graphData={graphData}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="transparent"
                nodeCanvasObject={paintNode}
                nodePointerAreaPaint={nodePointerAreaPaint}
                onNodeHover={handleNodeHover}
                onNodeClick={handleNodeClick}
                linkColor={(link: any) => {
                  const src = typeof link.source === 'object'
                    ? (link.source as GraphNode).group
                    : null;
                  if (src === 'subject') return 'rgba(139, 92, 246, 0.3)';
                  if (src === 'task') return 'rgba(99, 102, 241, 0.2)';
                  return 'rgba(148, 163, 184, 0.15)';
                }}
                linkWidth={1.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={1.5}
                linkDirectionalParticleColor={(link: any) => {
                  const src = typeof link.source === 'object'
                    ? (link.source as GraphNode).group
                    : null;
                  return src === 'subject' ? '#a78bfa' : '#818cf8';
                }}
                cooldownTicks={100}
                enableZoomInteraction={true}
                enablePanInteraction={true}
              />

              {/* Phase 6: Hover Tooltip */}
              {hoveredNode && (
                <div
                  className="absolute pointer-events-none z-50 px-3 py-2 rounded-xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/60 shadow-xl text-xs"
                  style={{
                    left: '50%',
                    bottom: '16px',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: hoveredNode.color }}
                    />
                    <span className="font-semibold text-slate-200 max-w-[200px] truncate">
                      {hoveredNode.name}
                    </span>
                    <span className="text-slate-500 uppercase tracking-wider text-[9px]">
                      {hoveredNode.group}
                    </span>
                  </div>
                  {hoveredNode.group === 'note' && hoveredNode.backlinks !== undefined && (
                    <p className="text-slate-400 mt-1">
                      {hoveredNode.backlinks} backlink{hoveredNode.backlinks !== 1 ? 's' : ''}
                    </p>
                  )}
                  {hoveredNode.group === 'note' && (
                    <p className="text-violet-400 mt-0.5">Click to open</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Filter Toggle Button
// ---------------------------------------------------------------------------

const FilterToggle: React.FC<{
  label: string;
  color: string;
  active: boolean;
  count: number;
  onClick: () => void;
}> = ({ label, color, active, count, onClick }) => (
  <button
    onClick={onClick}
    className={[
      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150',
      active
        ? 'bg-slate-800 text-slate-200 border border-slate-700'
        : 'bg-transparent text-slate-600 border border-transparent hover:bg-slate-800/50',
    ].join(' ')}
  >
    <span
      className="w-2 h-2 rounded-full transition-opacity"
      style={{ backgroundColor: color, opacity: active ? 1 : 0.3 }}
    />
    {active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
    <span>{label}</span>
    <span className="text-slate-500 font-mono">{count}</span>
  </button>
);

// ---------------------------------------------------------------------------
// Utility: lighten a hex color by a fraction (for hover state)
// ---------------------------------------------------------------------------

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default NetworkGraphModal;
