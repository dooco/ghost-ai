"use client";

import { Circle, Cylinder, Diamond, Hexagon, Pill, Square } from "lucide-react";
import {
  useRef,
  type ComponentType,
  type DragEvent,
  type SVGProps,
} from "react";

import { ShapeBackground } from "@/components/editor/shape-background";
import {
  CANVAS_DRAG_MIME_TYPE,
  type CanvasNodeShape,
  type CanvasShapeDragPayload,
  DEFAULT_NODE_COLOR,
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

type PreviewRefMap = Partial<Record<CanvasNodeShape, HTMLDivElement | null>>;

export function ShapePanel() {
  const previewRefs = useRef<PreviewRefMap>({});

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

    const preview = previewRefs.current[shape];
    if (preview) {
      event.dataTransfer.setDragImage(preview, size.width / 2, size.height / 2);
    }
  };

  return (
    <>
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
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] -top-[9999px]"
      >
        {SHAPE_OPTIONS.map(({ shape }) => {
          const size = NODE_SHAPE_DEFAULT_SIZES[shape];
          return (
            <div
              key={shape}
              ref={(el) => {
                previewRefs.current[shape] = el;
              }}
              className="relative opacity-70"
              style={{ width: size.width, height: size.height }}
            >
              <ShapeBackground shape={shape} color={DEFAULT_NODE_COLOR} />
            </div>
          );
        })}
      </div>
    </>
  );
}
