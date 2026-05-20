"use client";

import { useMemo } from "react";

import { EditorDialogShell } from "@/components/editor/editor-dialog-shell";
import { Button } from "@/components/ui/button";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import {
  NODE_COLORS,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
} from "@/types/canvas";

interface StarterTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <EditorDialogShell
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      title="Starter templates"
      description="Pick a template to load it into your canvas. This replaces the current canvas contents."
    >
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CANVAS_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onImport={() => {
                onImport(template);
                onClose();
              }}
            />
          ))}
        </div>
      </div>
    </EditorDialogShell>
  );
}

interface TemplateCardProps {
  template: CanvasTemplate;
  onImport: () => void;
}

function TemplateCard({ template, onImport }: TemplateCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-bg-surface p-4">
      <TemplatePreview template={template} />
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-copy-primary">
          {template.name}
        </h3>
        <p className="text-xs leading-snug text-copy-muted">
          {template.description}
        </p>
      </div>
      <Button type="button" size="sm" onClick={onImport} className="self-start">
        Import
      </Button>
    </div>
  );
}

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 140;
const PREVIEW_PADDING = 12;

interface TemplatePreviewProps {
  template: CanvasTemplate;
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  const layout = useMemo(() => computePreviewLayout(template), [template]);

  return (
    <div
      className="overflow-hidden rounded-xl border border-surface-border bg-bg-base"
      style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
    >
      <svg
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
        viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
        aria-hidden="true"
      >
        {layout.edges.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="var(--text-faint)"
            strokeWidth={1}
          />
        ))}
        {layout.nodes.map((rendered) => (
          <PreviewShape key={rendered.id} {...rendered} />
        ))}
      </svg>
    </div>
  );
}

interface RenderedNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: CanvasNodeShape;
  color: CanvasNodeColor;
}

interface RenderedEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface PreviewLayout {
  nodes: RenderedNode[];
  edges: RenderedEdge[];
}

function computePreviewLayout(template: CanvasTemplate): PreviewLayout {
  if (template.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const dims = template.nodes.map((n) => nodeDimensions(n));
  const minX = Math.min(...dims.map((d) => d.x));
  const minY = Math.min(...dims.map((d) => d.y));
  const maxX = Math.max(...dims.map((d) => d.x + d.w));
  const maxY = Math.max(...dims.map((d) => d.y + d.h));

  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const availableW = PREVIEW_WIDTH - PREVIEW_PADDING * 2;
  const availableH = PREVIEW_HEIGHT - PREVIEW_PADDING * 2;
  const scale = Math.min(availableW / contentW, availableH / contentH);

  const offsetX = (PREVIEW_WIDTH - contentW * scale) / 2;
  const offsetY = (PREVIEW_HEIGHT - contentH * scale) / 2;

  const project = (x: number, y: number) => ({
    x: offsetX + (x - minX) * scale,
    y: offsetY + (y - minY) * scale,
  });

  const renderedNodes: RenderedNode[] = template.nodes.map((n) => {
    const d = nodeDimensions(n);
    const p = project(d.x, d.y);
    return {
      id: n.id,
      x: p.x,
      y: p.y,
      width: d.w * scale,
      height: d.h * scale,
      shape: n.data.shape,
      color: n.data.color,
    };
  });

  const renderedNodeMap = new Map(renderedNodes.map((n) => [n.id, n]));

  const renderedEdges: RenderedEdge[] = template.edges
    .map((e) => {
      const source = renderedNodeMap.get(e.source);
      const target = renderedNodeMap.get(e.target);
      if (!source || !target) return null;
      return {
        id: e.id,
        x1: source.x + source.width / 2,
        y1: source.y + source.height / 2,
        x2: target.x + target.width / 2,
        y2: target.y + target.height / 2,
      };
    })
    .filter((e): e is RenderedEdge => e !== null);

  return { nodes: renderedNodes, edges: renderedEdges };
}

function nodeDimensions(n: CanvasNode) {
  const style = n.style ?? {};
  const w = typeof style.width === "number" ? style.width : 160;
  const h = typeof style.height === "number" ? style.height : 80;
  return { x: n.position.x, y: n.position.y, w, h };
}

function PreviewShape({ x, y, width, height, shape, color }: RenderedNode) {
  const palette =
    NODE_COLORS.find((entry) => entry.id === color) ?? NODE_COLORS[0];
  const stroke = "var(--border-default)";
  const strokeWidth = 0.75;

  if (shape === "rectangle") {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={3}
        fill={palette.fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (shape === "pill" || shape === "circle") {
    const radius = Math.min(width, height) / 2;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        fill={palette.fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (shape === "diamond") {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const points = `${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`;
    return (
      <polygon
        points={points}
        fill={palette.fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (shape === "hexagon") {
    const inset = width * 0.2;
    const points = [
      [x + inset, y],
      [x + width - inset, y],
      [x + width, y + height / 2],
      [x + width - inset, y + height],
      [x + inset, y + height],
      [x, y + height / 2],
    ]
      .map(([px, py]) => `${px},${py}`)
      .join(" ");
    return (
      <polygon
        points={points}
        fill={palette.fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (shape === "cylinder") {
    const ry = Math.min(height * 0.12, 6);
    return (
      <g>
        <rect
          x={x}
          y={y + ry}
          width={width}
          height={height - ry * 2}
          fill={palette.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <ellipse
          cx={x + width / 2}
          cy={y + ry}
          rx={width / 2}
          ry={ry}
          fill={palette.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <ellipse
          cx={x + width / 2}
          cy={y + height - ry}
          rx={width / 2}
          ry={ry}
          fill={palette.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </g>
    );
  }

  return null;
}
