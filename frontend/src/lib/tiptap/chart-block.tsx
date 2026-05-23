/**
 * chart-block.tsx
 * Data Chart Visualization Block — Tiptap Node Extension powered by Recharts.
 *
 * v2 Changes:
 * - React.memo on DataChartView AND ChartRenderer to prevent jank
 * - REMOVED inline contextual toolbar (moved to global ChartToolbar)
 * - REMOVED inline CSV popover (moved to SpreadsheetModal)
 * - Added `showLegend` and `colorTheme` as node attributes (persistent state)
 * - Cleaner, focused component — only renders chart + resize handle
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import React, { useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { GripHorizontal } from 'lucide-react';

// ─── Types & Constants ───────────────────────────────────────────────────────

export type ChartType = 'bar' | 'line' | 'area' | 'pie';

export const DEFAULT_CHART_COLORS = [
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#0ea5e9', // sky-500
];

export const SAMPLE_CHART_DATA = [
  { name: 'Jan', Revenue: 4200, Expenses: 2400, Profit: 1800 },
  { name: 'Feb', Revenue: 3800, Expenses: 1398, Profit: 2402 },
  { name: 'Mar', Revenue: 5100, Expenses: 3800, Profit: 1300 },
  { name: 'Apr', Revenue: 4780, Expenses: 3908, Profit: 872 },
  { name: 'May', Revenue: 5890, Expenses: 4800, Profit: 1090 },
  { name: 'Jun', Revenue: 6390, Expenses: 3800, Profit: 2590 },
];

// ─── Chart Renderer (React.memo) ────────────────────────────────────────────

interface ChartRendererProps {
  type: ChartType;
  data: Record<string, string | number>[];
  height: number;
  showLegend: boolean;
  colors: string[];
}

const ChartRenderer: React.FC<ChartRendererProps> = React.memo(
  ({ type, data, height, showLegend, colors }) => {
    const allKeys = data.length > 0 ? Object.keys(data[0]) : [];
    const categoryKey = allKeys[0] ?? 'name';
    const numericKeys = allKeys.filter(
      (k) => k !== categoryKey && data.some((row) => typeof row[k] === 'number'),
    );

    const commonProps = { data, margin: { top: 8, right: 24, left: 8, bottom: 8 } };

    const renderTooltip = (
      <Tooltip
        contentStyle={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          fontSize: '13px',
        }}
      />
    );

    const renderGrid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />;
    const renderXAxis = <XAxis dataKey={categoryKey} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />;
    const renderYAxis = <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />;
    const renderLegend = showLegend ? <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} /> : null;

    if (type === 'pie') {
      const valueKey = numericKeys[0] ?? allKeys[1] ?? 'value';
      return (
        <ResponsiveContainer width="100%" height={height - 40}>
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={categoryKey}
              cx="50%" cy="50%"
              outerRadius={Math.min(height / 3, 140)}
              innerRadius={Math.min(height / 6, 60)}
              paddingAngle={2}
              strokeWidth={2}
              stroke="rgba(255,255,255,0.8)"
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            {renderTooltip}
            {renderLegend}
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={height - 40}>
          <LineChart {...commonProps}>
            {renderGrid}
            {renderXAxis}
            {renderYAxis}
            {renderTooltip}
            {renderLegend}
            {numericKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[idx % colors.length]}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'area') {
      return (
        <ResponsiveContainer width="100%" height={height - 40}>
          <AreaChart {...commonProps}>
            {renderGrid}
            {renderXAxis}
            {renderYAxis}
            {renderTooltip}
            {renderLegend}
            {numericKeys.map((key, idx) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[idx % colors.length]}
                fill={colors[idx % colors.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // Default: bar
    return (
      <ResponsiveContainer width="100%" height={height - 40}>
        <BarChart {...commonProps}>
          {renderGrid}
          {renderXAxis}
          {renderYAxis}
          {renderTooltip}
          {renderLegend}
          {numericKeys.map((key, idx) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[idx % colors.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  },
);

ChartRenderer.displayName = 'ChartRenderer';

// ─── React NodeView (React.memo) ────────────────────────────────────────────

const DataChartView: React.FC<NodeViewProps> = React.memo(
  ({ node, updateAttributes, selected, editor: tiptapEditor }) => {
    const isEditable = tiptapEditor.isEditable;
    const chartType = (node.attrs.chartType as ChartType) || 'bar';
    const chartData = (node.attrs.chartData as Record<string, string | number>[]) || SAMPLE_CHART_DATA;
    const height = (node.attrs.height as number) || 400;
    const showLegend = node.attrs.showLegend !== false;
    const colors = (node.attrs.colorTheme as string[]) || DEFAULT_CHART_COLORS;

    // ── Memoized chart ────────────────────────────────────────────────────
    const chart = useMemo(
      () => (
        <ChartRenderer
          type={chartType}
          data={chartData}
          height={height}
          showLegend={showLegend}
          colors={colors}
        />
      ),
      [chartType, chartData, height, showLegend, colors],
    );

    // ── Resize handler ────────────────────────────────────────────────────
    const handleResizeStart = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startY = e.clientY;
        const startH = height;

        const onMove = (ev: MouseEvent) => {
          const delta = ev.clientY - startY;
          const newH = Math.max(200, Math.min(800, startH + delta));
          updateAttributes({ height: newH });
        };

        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      },
      [height, updateAttributes],
    );

    return (
      <NodeViewWrapper
        className={`chart-block-wrapper ${selected ? 'chart-block--selected' : ''}`}
        style={{ height: `${height}px` }}
      >
        {/* Chart canvas — clean, no inline toolbar */}
        <div className="chart-block-canvas">
          {chart}
        </div>

        {/* Resize handle */}
        {isEditable && (
          <div
            className="resize-handle"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          >
            <GripHorizontal className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </NodeViewWrapper>
    );
  },
  // Custom React.memo comparator
  (prev, next) =>
    prev.selected === next.selected &&
    prev.node.attrs.height === next.node.attrs.height &&
    prev.node.attrs.chartType === next.node.attrs.chartType &&
    prev.node.attrs.chartData === next.node.attrs.chartData &&
    prev.node.attrs.showLegend === next.node.attrs.showLegend &&
    prev.node.attrs.colorTheme === next.node.attrs.colorTheme &&
    prev.editor.isEditable === next.editor.isEditable,
);

DataChartView.displayName = 'DataChartView';

// ─── Tiptap Node Extension ──────────────────────────────────────────────────

export const DataChart = Node.create({
  name: 'dataChart',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      chartType: {
        default: 'bar',
        parseHTML: (el) => el.getAttribute('data-chart-type') || 'bar',
        renderHTML: (attrs) => ({ 'data-chart-type': attrs.chartType }),
      },
      chartData: {
        default: SAMPLE_CHART_DATA,
        parseHTML: (el) => {
          const raw = el.getAttribute('data-chart-data');
          return raw ? JSON.parse(raw) : SAMPLE_CHART_DATA;
        },
        renderHTML: (attrs) => ({
          'data-chart-data': JSON.stringify(attrs.chartData),
        }),
      },
      height: {
        default: 400,
        parseHTML: (el) => Number(el.getAttribute('data-height')) || 400,
        renderHTML: (attrs) => ({ 'data-height': String(attrs.height) }),
      },
      showLegend: {
        default: true,
        parseHTML: (el) => el.getAttribute('data-show-legend') !== 'false',
        renderHTML: (attrs) => ({ 'data-show-legend': String(attrs.showLegend) }),
      },
      colorTheme: {
        default: null,
        parseHTML: (el) => {
          const raw = el.getAttribute('data-color-theme');
          return raw ? JSON.parse(raw) : null;
        },
        renderHTML: (attrs) =>
          attrs.colorTheme
            ? { 'data-color-theme': JSON.stringify(attrs.colorTheme) }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="dataChart"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'dataChart' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DataChartView, {
      stopEvent: () => true,
    });
  },
});
