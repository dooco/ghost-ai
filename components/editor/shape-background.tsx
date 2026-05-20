import { cn } from "@/lib/utils";
import {
  type CanvasNodeColor,
  type CanvasNodeShape,
  NODE_COLORS,
} from "@/types/canvas";

interface ShapeBackgroundProps {
  shape: CanvasNodeShape;
  color: CanvasNodeColor;
  selected?: boolean;
}

const REST_STROKE = "var(--border-default)";
const SELECTED_STROKE = "var(--text-muted)";

export function ShapeBackground({
  shape,
  color,
  selected = false,
}: ShapeBackgroundProps) {
  const palette =
    NODE_COLORS.find((entry) => entry.id === color) ?? NODE_COLORS[0];
  const stroke = selected ? SELECTED_STROKE : REST_STROKE;
  const strokeWidth = selected ? 2 : 1;

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    const radius = shape === "rectangle" ? "rounded-xl" : "rounded-full";
    return (
      <div
        className={cn(
          "absolute inset-0",
          radius,
          selected ? "border-copy-muted" : "border-surface-border",
          selected ? "border-2" : "border",
        )}
        style={{ backgroundColor: palette.fill }}
      />
    );
  }

  if (shape === "diamond") {
    return (
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          points="50,1 99,50 50,99 1,50"
          fill={palette.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          points="25,1 75,1 99,50 75,99 25,99 1,50"
          fill={palette.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (shape === "cylinder") {
    return (
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 1,12 A 49,11 0 0 1 99,12 L 99,88 A 49,11 0 0 1 1,88 Z"
          fill={palette.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 1,12 A 49,11 0 0 0 99,12"
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  return null;
}
