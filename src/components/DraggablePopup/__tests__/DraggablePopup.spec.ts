import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import Popup from "../DraggablePopup.vue";
const dispose = vi.fn();
vi.mock("@floating-ui/vue", async () => {
  const { ref } = await import("vue");
  return {
    useFloating: () => ({
      x: ref(30),
      y: ref(40),
      isPositioned: ref(true),
      placement: ref("bottom-start"),
      update: vi.fn(),
    }),
    autoUpdate: () => dispose,
    offset: vi.fn(),
    flip: vi.fn(),
    shift: vi.fn(),
  };
});
afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});
describe("DraggablePopup contract", () => {
  it.each([
    { snapToEdge: true, keepInViewport: true, x: 8 },
    { snapToEdge: false, keepInViewport: true, x: 20 },
    { snapToEdge: true, keepInViewport: false, x: 20 },
  ])(
    "applies drag snapping only when enabled with viewport boundaries: %o",
    async (options) => {
      const w = mount(Popup, {
        props: {
          modelValue: true,
          snapToEdge: options.snapToEdge,
          keepInViewport: options.keepInViewport,
        },
        attachTo: document.body,
      });
      await flushPromises();
      const p = document.querySelector<HTMLElement>(".draggable-popup")!;
      vi.spyOn(p, "getBoundingClientRect").mockReturnValue({
        x: 200,
        y: 200,
        width: 360,
        height: 280,
        top: 200,
        left: 200,
        right: 560,
        bottom: 480,
        toJSON: () => ({}),
      });
      pointer(p.querySelector("header")!, "pointerdown", 200, 200);
      pointer(window, "pointermove", 20, 200);
      expect(w.vm.getRect().x).toBe(options.x);
      pointer(window, "pointermove", 40, 200);
      expect(w.vm.getRect().x).toBe(40);
      pointer(window, "pointerup", 40, 200);
      expect(w.emitted("drag-end")).toHaveLength(1);
      expect(w.emitted("drag-end")![0]![0]).toEqual(w.vm.getRect());
      w.unmount();
    },
  );
  it("still detects removal of an anchored trigger while positioning is paused by maximize", async () => {
    const w = mount(Popup, {
      props: { modelValue: true },
      slots: { trigger: "<button>Trigger</button>" },
      attachTo: document.body,
    });
    await flushPromises();
    w.vm.maximize();
    await nextTick();
    w.get(".draggable-popup__trigger button").element.remove();
    await flushPromises();
    expect(w.emitted("update:modelValue")).toEqual([[false]]);
    await w.setProps({ modelValue: false });
    expect(w.emitted("close")).toEqual([[{ reason: "anchor-removed" }]]);
    w.unmount();
  });
  it("maximizes once, disables interaction and restores normal geometry on close", async () => {
    const w = mount(Popup, {
      props: {
        modelValue: true,
        variant: "drawer",
        width: 420,
        maxWidth: 500,
        maxHeight: 400,
      },
      attachTo: document.body,
    });
    await flushPromises();
    const normal = w.vm.getRect();
    w.vm.maximize();
    w.vm.maximize();
    await nextTick();
    expect(w.vm.isMaximized()).toBe(true);
    expect(w.vm.getRect()).toEqual({
      x: 8,
      y: 8,
      width: window.innerWidth - 16,
      height: window.innerHeight - 16,
    });
    expect(w.emitted("maximize-change")).toHaveLength(1);
    expect(document.querySelector("[data-handle]")).toBeNull();
    pointer(document.querySelector("header")!, "pointerdown");
    expect(w.emitted("drag-start")).toBeUndefined();
    w.vm.restore();
    w.vm.restore();
    await nextTick();
    expect(w.vm.getRect()).toEqual(normal);
    expect(w.emitted("maximize-change")).toHaveLength(2);
    w.vm.maximize();
    await w.setProps({ modelValue: false });
    expect(w.vm.isMaximized()).toBe(false);
    expect(w.vm.getRect()).toEqual(normal);
    await w.setProps({ modelValue: true });
    expect(w.vm.getRect().width).toBe(420);
    w.unmount();
  });
  it("honors disabled maximizing and restores when maximizable is switched off", async () => {
    const w = mount(Popup, {
      props: { modelValue: true, maximizable: false },
      attachTo: document.body,
    });
    await flushPromises();
    w.vm.maximize();
    expect(w.vm.isMaximized()).toBe(false);
    expect(document.querySelector('[aria-label="放大面板"]')).toBeNull();
    await w.setProps({ maximizable: true });
    w.vm.toggleMaximize();
    expect(w.vm.isMaximized()).toBe(true);
    await w.setProps({ maximizable: false });
    expect(w.vm.isMaximized()).toBe(false);
    w.unmount();
  });
  it("supports manual drawer without a trigger, forwards panel attributes and skips anchor observers", async () => {
    const w = mount(Popup, {
      props: { modelValue: true, variant: "drawer", trigger: "manual" },
      attrs: {
        class: "custom-panel",
        style: "--dp-bg: pink",
        "data-testid": "custom",
      },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.querySelector(".draggable-popup__trigger")).toBeNull();
    const p = document.querySelector<HTMLElement>(".draggable-popup")!;
    expect(p.classList.contains("custom-panel")).toBe(true);
    expect(p.style.getPropertyValue("--dp-bg")).toBe("pink");
    expect(p.dataset.mode).toBe("docked");
    expect(p.querySelector('[data-handle="ml"]')).not.toBeNull();
    expect(p.dataset.testid).toBe("custom");
    expect(dispose).not.toHaveBeenCalled();
    await w.setProps({ variant: "popup" });
    await flushPromises();
    expect(p.dataset.mode).toBe("anchored");
    w.vm.maximize();
    await nextTick();
    expect(dispose).toHaveBeenCalled();
    w.vm.restore();
    await nextTick();
    w.unmount();
  });
  function pointer(target: EventTarget, type: string, x = 10, y = 10) {
    const event = new MouseEvent(type, {
      bubbles: true,
      button: 0,
      clientX: x,
      clientY: y,
    });
    Object.defineProperty(event, "pointerId", { value: 1 });
    target.dispatchEvent(event);
  }
  it("detaches once, ends pointercancel once, ignores subsequent movement and resets", async () => {
    const w = mount(Popup, {
      props: { modelValue: true },
      attachTo: document.body,
    });
    await nextTick();
    const p = document.querySelector<HTMLElement>(".draggable-popup")!;
    vi.spyOn(p, "getBoundingClientRect").mockReturnValue({
      x: 30,
      y: 40,
      width: 360,
      height: 280,
      top: 40,
      left: 30,
      right: 390,
      bottom: 320,
      toJSON: () => ({}),
    });
    pointer(p.querySelector("header")!, "pointerdown");
    pointer(window, "pointermove", 110, 10);
    expect(w.vm.getRect().x).toBe(130);
    pointer(window, "pointercancel");
    pointer(window, "pointerup");
    pointer(window, "pointermove", 210, 10);
    expect(w.vm.getRect().x).toBe(130);
    expect(w.emitted("drag-start")).toHaveLength(1);
    expect(w.emitted("drag-end")).toHaveLength(1);
    expect(w.emitted("mode-change")).toEqual([[{ mode: "detached" }]]);
    w.vm.resetPosition();
    await nextTick();
    expect(w.emitted("mode-change")).toEqual([
      [{ mode: "detached" }],
      [{ mode: "anchored" }],
    ]);
    w.unmount();
  });
  it("ignores disabled dragging and header controls, cleans active resize on close", async () => {
    const w = mount(Popup, {
      props: { modelValue: true, draggable: false },
      slots: { header: "<input />" },
      attachTo: document.body,
    });
    await nextTick();
    const p = document.querySelector<HTMLElement>(".draggable-popup")!;
    pointer(p.querySelector("header")!, "pointerdown");
    expect(w.emitted("drag-start")).toBeUndefined();
    await w.setProps({ draggable: true });
    pointer(p.querySelector("input")!, "pointerdown");
    pointer(p.querySelector("button")!, "pointerdown");
    expect(w.emitted("drag-start")).toBeUndefined();
    pointer(p.querySelector("[data-handle]")!, "pointerdown");
    expect(w.emitted("resize-start")).toHaveLength(1);
    await w.setProps({ modelValue: false });
    expect(w.emitted("resize-end")).toHaveLength(1);
    const before = w.vm.getRect();
    pointer(window, "pointermove", 500, 500);
    expect(w.vm.getRect()).toEqual(before);
    w.unmount();
  });
  it.each(["outside", "escape"] as const)(
    "reports %s close reason and removes document listeners",
    async (reason) => {
      const add = vi.spyOn(document, "addEventListener"),
        remove = vi.spyOn(document, "removeEventListener");
      const w = mount(Popup, {
        props: { modelValue: true, closeOnOutsideClick: true },
        attachTo: document.body,
      });
      await flushPromises();
      if (reason === "outside") pointer(document.body, "pointerdown");
      else
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      await w.setProps({ modelValue: false });
      expect(w.emitted("close")).toEqual([[{ reason }]]);
      for (const [name, fn] of add.mock.calls.filter(
        ([name]) => name === "pointerdown" || name === "keydown",
      ))
        expect(
          remove.mock.calls.some(
            ([removedName, removedFn]) =>
              removedName === name && removedFn === fn,
          ),
        ).toBe(true);
      w.unmount();
      add.mockRestore();
      remove.mockRestore();
    },
  );
  it("renders slots and emits close exactly once on external transition", async () => {
    const w = mount(Popup, {
      props: { modelValue: true },
      slots: {
        trigger: "Trigger",
        header: "Custom",
        default: "Body",
        footer: "Footer",
      },
      attachTo: document.body,
    });
    await nextTick();
    expect(document.body.textContent).toContain("Custom");
    expect(document.body.textContent).toContain("Footer");
    await w.setProps({ modelValue: false });
    await w.setProps({ modelValue: false });
    expect(w.emitted("open")).toHaveLength(1);
    expect(w.emitted("close")).toEqual([[{ reason: "programmatic" }]]);
    expect(dispose).toHaveBeenCalled();
    w.unmount();
  });
  it("close button requests one change and preserves reason until model changes", async () => {
    const w = mount(Popup, {
      props: { modelValue: true },
      attachTo: document.body,
    });
    await nextTick();
    document
      .querySelector<HTMLButtonElement>('[aria-label="关闭面板"]')!
      .click();
    expect(w.emitted("update:modelValue")).toEqual([[false]]);
    expect(w.emitted("close")).toBeUndefined();
    await w.setProps({ modelValue: false });
    expect(w.emitted("close")).toEqual([[{ reason: "close-button" }]]);
    w.unmount();
  });
  it("supports manual trigger, disabled handles, expose and initial-size semantics", async () => {
    const w = mount(Popup, {
      props: {
        modelValue: false,
        trigger: "manual",
        resizable: false,
        width: 400,
      },
    });
    await w.get(".draggable-popup__trigger").trigger("click");
    expect(w.emitted("update:modelValue")).toBeUndefined();
    expect(w.vm.getRect().width).toBe(400);
    await w.setProps({ width: 450 });
    expect(w.vm.getRect().width).toBe(400);
    w.vm.resetSize();
    expect(w.vm.getRect().width).toBe(450);
    await w.setProps({ modelValue: true });
    expect(document.querySelector("[data-handle]")).toBeNull();
    w.unmount();
  });
  it("cleans positioning on repeated toggles and unmount", async () => {
    const w = mount(Popup, {
      props: { modelValue: false },
      attachTo: document.body,
    });
    for (let i = 0; i < 20; i++) {
      await w.setProps({ modelValue: true });
      await w.setProps({ modelValue: false });
    }
    expect(w.emitted("open")).toHaveLength(20);
    expect(w.emitted("close")).toHaveLength(20);
    expect(dispose).toHaveBeenCalledTimes(20);
    w.unmount();
  });
});
