import type { Placement } from "@floating-ui/vue";
export type { Placement };
export type ResizeHandle =
  "tl" | "tm" | "tr" | "mr" | "br" | "bm" | "bl" | "ml";
export type PopupMode = "anchored" | "detached";
export type CloseReason =
  | "trigger"
  | "close-button"
  | "outside"
  | "escape"
  | "programmatic"
  | "anchor-removed";
export interface PopupRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface PopupProps {
  modelValue: boolean;
  title?: string;
  placement?: Placement;
  offset?: number;
  boundaryPadding?: number;
  autoFlip?: boolean;
  autoShift?: boolean;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  draggable?: boolean;
  resizable?: boolean;
  resizeHandles?: ResizeHandle[];
  keepInViewport?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  teleportTo?: string | HTMLElement;
  zIndex?: number;
  trigger?: "click" | "manual";
}
export interface PopupExpose {
  resetPosition(): void;
  resetSize(): void;
  updatePosition(): void;
  getRect(): PopupRect;
}
export interface PopupEvents {
  "update:modelValue": [value: boolean];
  open: [];
  close: [event: { reason: CloseReason }];
  "mode-change": [event: { mode: PopupMode }];
  "placement-change": [event: { placement: Placement }];
  "drag-start": [rect: PopupRect];
  drag: [rect: PopupRect];
  "drag-end": [rect: PopupRect];
  "resize-start": [rect: PopupRect];
  resize: [rect: PopupRect];
  "resize-end": [rect: PopupRect];
}
