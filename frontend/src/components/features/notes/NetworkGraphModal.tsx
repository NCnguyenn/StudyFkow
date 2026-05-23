'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { X, Loader2, Share2 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api-utils';

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

  // ── useMemo: process graph data once per fetch, not on every render ────────
  const graphData = useMemo(() => ({
    nodes: rawData.nodes,
    links: rawData.links,
  }), [rawData]);

  // ── paintNode: multi-layer rendering by group ─────────────────────────────
  const paintNode = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode;
      if (typeof n.x !== 'number' || typeof n.y !== 'number' || isNaN(n.x) || isNaN(n.y)) {
        return;
      }

      const label = n.name || 'Untitled';
      const group: NodeGroup = n.group ?? 'note';
      const r = GROUP_RADIUS[group];
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

  const handleNodeHover = useCallback((node: object | null) => {
    setHoveredNode(node as GraphNode | null);
  }, []);

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
            <ForceGraph2D
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="transparent"
              nodeCanvasObject={paintNode}
              nodePointerAreaPaint={nodePointerAreaPaint}
              onNodeHover={handleNodeHover}
              linkColor={(link) => {
                // Tint links by their source node group
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
              linkDirectionalParticleColor={(link) => {
                const src = typeof link.source === 'object'
                  ? (link.source as GraphNode).group
                  : null;
                return src === 'subject' ? '#a78bfa' : '#818cf8';
              }}
              cooldownTicks={100}
              enableZoomInteraction={true}
              enablePanInteraction={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

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
