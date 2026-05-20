'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { X, Loader2, Share2 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GraphNode {
  id: string;
  name: string;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
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
// Main Component
// ---------------------------------------------------------------------------

export const NetworkGraphModal: React.FC<NetworkGraphModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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
        const data: GraphData = await res.json();
        if (!cancelled) setGraphData(data);
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

  // Custom node rendering
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name || 'Untitled';
      const fontSize = Math.max(12 / globalScale, 3);
      const r = 5;

      // Node circle — indigo
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = '#6366f1';
      ctx.fill();

      // Glow ring
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(label, node.x, node.y + r + 3);
    },
    [],
  );

  if (!isOpen) return null;

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              Knowledge Graph
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {graphData.nodes.length} nodes · {graphData.links.length} links
            </span>
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
              nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
              }}
              linkColor={() => 'rgba(99, 102, 241, 0.25)'}
              linkWidth={1.5}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleColor={() => '#818cf8'}
              cooldownTicks={80}
              enableZoomInteraction={true}
              enablePanInteraction={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkGraphModal;
