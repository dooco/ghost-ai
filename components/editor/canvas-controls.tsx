"use client";

import { Maximize2, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";

interface CanvasControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

interface ControlButtonProps {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  disabled?: boolean;
}

function ControlButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-copy-muted transition-colors",
        "hover:bg-bg-subtle hover:text-copy-primary",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-copy-muted",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function CanvasControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
}: CanvasControlsProps) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-10">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-surface-border bg-bg-elevated/90 p-1.5 shadow-lg backdrop-blur">
        <ControlButton label="Zoom out" icon={ZoomOut} onClick={onZoomOut} />
        <ControlButton label="Fit view" icon={Maximize2} onClick={onFitView} />
        <ControlButton label="Zoom in" icon={ZoomIn} onClick={onZoomIn} />
        <div aria-hidden="true" className="mx-1 h-5 w-px bg-surface-border" />
        <ControlButton
          label="Undo"
          icon={Undo2}
          onClick={onUndo}
          disabled={!canUndo}
        />
        <ControlButton
          label="Redo"
          icon={Redo2}
          onClick={onRedo}
          disabled={!canRedo}
        />
      </div>
    </div>
  );
}
