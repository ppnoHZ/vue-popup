import type { Placement } from "@floating-ui/vue";
import type { CSSProperties, VNodeChild } from "vue";
export type PanelContent = VNodeChild | (() => VNodeChild);
export type DragHandle =
  string | HTMLElement | (() => HTMLElement | null | undefined) | false;
export type DrawerPlacement = "left" | "right" | "top" | "bottom";
export interface PanelButtonProps {
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  class?: string;
  style?: CSSProperties;
}
export type { Placement };
export type ResizeHandle =
  "tl" | "tm" | "tr" | "mr" | "br" | "bm" | "bl" | "ml";
export type PopupMode = "anchored" | "detached" | "docked" | "centered";
export type PopupVariant = "popup" | "drawer" | "modal";
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
  modelValue?: boolean;
  open?: boolean;
  /** Ant Design Vue 3 compatibility; open takes precedence. */
  visible?: boolean;
  variant?: PopupVariant;
  maximizable?: boolean;
  motion?: boolean;
  motionDuration?: number;
  title?: PanelContent;
  footer?: PanelContent;
  extra?: PanelContent;
  closeIcon?: PanelContent;
  okText?: PanelContent;
  cancelText?: PanelContent;
  confirmLoading?: boolean;
  okButtonProps?: PanelButtonProps;
  cancelButtonProps?: PanelButtonProps;
  closable?: boolean;
  mask?: boolean;
  maskClosable?: boolean;
  maskStyle?: CSSProperties;
  rootClassName?: string;
  wrapClassName?: string;
  rootStyle?: CSSProperties;
  drawerStyle?: CSSProperties;
  keyboard?: boolean;
  centered?: boolean;
  destroyOnClose?: boolean;
  forceRender?: boolean;
  bodyStyle?: CSSProperties;
  headerStyle?: CSSProperties;
  footerStyle?: CSSProperties;
  getContainer?: string | HTMLElement | false | (() => HTMLElement);
  afterClose?: () => void;
  placement?: Placement;
  offset?: number;
  boundaryPadding?: number;
  autoFlip?: boolean;
  autoShift?: boolean;
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  draggable?: boolean;
  /** Hide the built-in header and its actions; provide accessible naming/actions in content. */
  showHeader?: boolean;
  /** Scoped to this panel. Omitted: dragHandle slot, otherwise built-in header. */
  dragHandle?: DragHandle;
  resizable?: boolean;
  resizeHandles?: ResizeHandle[];
  keepInViewport?: boolean;
  snapToEdge?: boolean;
  snapThreshold?: number;
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
  maximize(): void;
  restore(): void;
  toggleMaximize(): void;
  isMaximized(): boolean;
}
export interface PopupEvents {
  "update:modelValue": [value: boolean];
  "update:open": [value: boolean];
  "update:visible": [value: boolean];
  change: [open: boolean];
  ok: [event: MouseEvent];
  cancel: [event: MouseEvent | KeyboardEvent | undefined];
  afterOpenChange: [open: boolean];
  afterVisibleChange: [visible: boolean];
  "close-request": [
    event: { reason: CloseReason; event?: MouseEvent | KeyboardEvent },
  ];
  open: [];
  close: [event: { reason: CloseReason }];
  "mode-change": [event: { mode: PopupMode }];
  "placement-change": [event: { placement: Placement }];
  "maximize-change": [event: { maximized: boolean; rect: PopupRect }];
  "drag-start": [rect: PopupRect];
  drag: [rect: PopupRect];
  "drag-end": [rect: PopupRect];
  "resize-start": [rect: PopupRect];
  resize: [rect: PopupRect];
  "resize-end": [rect: PopupRect];
}
