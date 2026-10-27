import { defineComponent, h, mergeProps, ref } from "vue";
import DraggablePopup from "./DraggablePopup.vue";
import type { PopupExpose, PopupEvents } from "./types";
const events: (keyof PopupEvents)[] = [
  "update:modelValue",
  "update:open",
  "update:visible",
  "change",
  "open",
  "close",
  "ok",
  "cancel",
  "afterOpenChange",
  "afterVisibleChange",
  "close-request",
  "mode-change",
  "placement-change",
  "maximize-change",
  "drag-start",
  "drag",
  "drag-end",
  "resize-start",
  "resize",
  "resize-end",
];

function variantComponent(variant: "drawer" | "modal", name: string) {
  // Preserve the same typed public Props, Slots and exposed methods. Rendering
  // through attrs lets the base component own Boolean/default prop handling.
  return defineComponent({
    name,
    inheritAttrs: false,
    emits: events,
    setup(_, { attrs, slots, expose, emit }) {
      const panel = ref<PopupExpose>();
      const listeners = Object.fromEntries(
        events.map((event) => [
          "on" + event[0]!.toUpperCase() + event.slice(1),
          (...args: unknown[]) => emit(event, ...args),
        ]),
      );
      if (variant === "drawer") {
        listeners.onClose = () => {};
        listeners["onClose-request"] = (...args: unknown[]) => {
          const request = args[0] as PopupEvents["close-request"][0];
          emit("close-request", request);
          emit("close", request.event);
        };
      }
      expose({
        resetPosition: () => panel.value?.resetPosition(),
        resetSize: () => panel.value?.resetSize(),
        updatePosition: () => panel.value?.updatePosition(),
        getRect: () =>
          panel.value?.getRect() ?? { x: 0, y: 0, width: 0, height: 0 },
        maximize: () => panel.value?.maximize(),
        restore: () => panel.value?.restore(),
        toggleMaximize: () => panel.value?.toggleMaximize(),
        isMaximized: () => panel.value?.isMaximized() ?? false,
      } satisfies PopupExpose);
      return () =>
        h(
          DraggablePopup,
          mergeProps(
            { destroyOnClose: false, mask: true },
            attrs,
            { variant, ref: panel },
            listeners,
          ),
          slots,
        );
    },
  }) as unknown as typeof DraggablePopup;
}
type BaseInstance = InstanceType<typeof DraggablePopup>;
export type DraggableDrawerInstance = Omit<BaseInstance, "$props"> & {
  $props: Omit<BaseInstance["$props"], "onClose"> & {
    onClose?: ((event: MouseEvent) => void) | ((event: KeyboardEvent) => void);
  };
};
export const DraggableDrawer = variantComponent(
  "drawer",
  "DraggableDrawer",
) as unknown as { new (): DraggableDrawerInstance };
export type DraggableModalInstance = Omit<BaseInstance, "$props"> & {
  $props: Omit<BaseInstance["$props"], "onCancel"> & {
    onCancel?: ((event: MouseEvent) => void) | ((event: KeyboardEvent) => void);
  };
};
export type DraggableDrawerProps = DraggableDrawerInstance["$props"];
export type DraggableModalProps = DraggableModalInstance["$props"];
export const DraggableModal = variantComponent(
  "modal",
  "DraggableModal",
) as unknown as { new (): DraggableModalInstance };
