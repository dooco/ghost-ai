"use client";

import { Circle, Cylinder, Diamond, Hexagon, Pill, Square } from "lucide-react";
import type { ComponentType, DragEvent, SVGProps } from "react";

import {
  CANVAS_DRAG_MIME_TYPE,
  type CanvasNodeShape,
  type CanvasShapeDragPayload,
  NODE_SHAPE_DEFAULT_SIZES,
} from "@/types/canvas";

interface ShapeOption {
  shape: CanvasNodeShape;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { shape: "rectangle", label: "Rectangle", Icon: Square },
  { shape: "diamond", label: "Diamond", Icon: Diamond },
  { shape: "circle", label: "Circle", Icon: Circle },
  { shape: "pill", label: "Pill", Icon: Pill },
  { shape: "cylinder", label: "Cylinder", Icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", Icon: Hexagon },
];

export function ShapePanel() {
  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    shape: CanvasNodeShape,
  ) => {
    const size = NODE_SHAPE_DEFAULT_SIZES[shape];
    const payload: CanvasShapeDragPayload = {
      shape,
      width: size.width,
      height: size.height,
    };
    event.dataTransfer.setData(CANVAS_DRAG_MIME_TYPE, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-bg-elevated/90 p-1.5 shadow-lg backdrop-blur">
        {SHAPE_OPTIONS.map(({ shape, label, Icon }) => (
          <button
            key={shape}
            type="button"
            draggable
            onDragStart={(event) => handleDragStart(event, shape)}
            aria-label={`Drag ${label}`}
            title={label}
            className="flex h-9 w-9 cursor-grab items-center justify-center rounded-full text-copy-muted transition-colors hover:bg-bg-subtle hover:text-copy-primary active:cursor-grabbing"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
