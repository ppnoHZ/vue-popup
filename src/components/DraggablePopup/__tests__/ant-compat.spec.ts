import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises, enableAutoUnmount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import { DraggablePopup, DraggableDrawer, DraggableModal } from "../index";
enableAutoUnmount(afterEach);
afterEach(() => {
  document.body.innerHTML = "";
  document.body.style.overflow = "";
});
describe("Ant Design Vue migration contract", () => {
  it("lets drawers span the viewport on wide screens and still honors explicit maxWidth", async () => {
    vi.stubGlobal("innerWidth", 1600);
    try {
      const w = mount(DraggableDrawer, {
        props: { open: true, width: 1200 },
        attachTo: document.body,
      });
      await flushPromises();
      expect(w.vm.getRect().width).toBe(1200);
      await w.setProps({ maxWidth: 800 });
      expect(w.vm.getRect().width).toBe(800);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it.each(["left", "right", "top", "bottom"] as const)(
    "supports Drawer placement=%s and changes side without retaining the previous full axis",
    async (placement) => {
      const w = mount(DraggableDrawer, {
        props: { open: true, placement, width: 400, height: 240 },
        attachTo: document.body,
      });
      await flushPromises();
      const r = w.vm.getRect();
      expect(r.width).toBe(400);
      expect(r.height).toBe(240);
      expect(r.x).toBe(placement === "right" ? window.innerWidth - 408 : 8);
      expect(r.y).toBe(placement === "bottom" ? window.innerHeight - 248 : 8);
      await w.setProps({ placement: "right" });
      expect(w.vm.getRect()).toEqual({
        x: window.innerWidth - 408,
        y: 8,
        width: 400,
        height: 240,
      });
    },
  );
  it("respects explicit drawer height and exposes vertical resize handles by default", async () => {
    const w = mount(DraggableDrawer, {
      props: { open: true, height: 320 },
      attachTo: document.body,
    });
    await flushPromises();
    expect(w.vm.getRect().height).toBe(320);
    expect(document.querySelector('[data-handle="tm"]')).not.toBeNull();
    expect(document.querySelector('[data-handle="bm"]')).not.toBeNull();
  });
  it("allows drawers above 800px on large viewports while honoring explicit maxHeight", async () => {
    vi.stubGlobal("innerHeight", 1100);
    try {
      const w = mount(DraggableDrawer, {
        props: { open: true, height: 900 },
        attachTo: document.body,
      });
      await flushPromises();
      expect(w.vm.getRect().height).toBe(900);
      await w.setProps({ maxHeight: 600 });
      expect(w.vm.getRect().height).toBe(600);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("supports open and visible aliases with deterministic priority", async () => {
    const w = mount(DraggablePopup, {
      props: { open: false, visible: true, modelValue: true },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await w.setProps({ open: undefined });
    await flushPromises();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    document
      .querySelector<HTMLButtonElement>('[aria-label="关闭面板"]')!
      .click();
    expect(w.emitted("update:open")).toEqual([[false]]);
    expect(w.emitted("update:visible")).toEqual([[false]]);
    expect(w.emitted("update:modelValue")).toEqual([[false]]);
    expect(w.emitted("cancel")?.[0]?.[0]).toBeInstanceOf(MouseEvent);
    await w.setProps({ visible: false });
    expect(w.emitted("close")).toEqual([[{ reason: "close-button" }]]);
  });
  it("renders title, extra, footer, closeIcon and text slots with slot priority", async () => {
    const w = mount(DraggableModal, {
      props: { open: true, title: h("b", "Prop Title"), footer: null },
      slots: {
        title: "Slot Title",
        extra: "Extra",
        footer: "Footer slot",
        closeIcon: "X",
      },
      attachTo: document.body,
    });
    await flushPromises();
    const p = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(p.textContent).toContain("Slot Title");
    expect(p.textContent).not.toContain("Prop Title");
    expect(p.textContent).toContain("Extra");
    expect(p.textContent).toContain("Footer slot");
    expect(p.querySelector('[aria-label="关闭面板"]')?.textContent).toContain(
      "X",
    );
    expect(p.dataset.mode).toBe("centered");
    w.vm.maximize();
    expect(w.vm.isMaximized()).toBe(true);
  });
  it("Modal ok remains controlled, confirmLoading blocks submission and footer=null removes defaults", async () => {
    const w = mount(DraggableModal, {
      props: { open: true, confirmLoading: true },
      slots: { okText: "Submit", cancelText: "Back" },
      attachTo: document.body,
    });
    await flushPromises();
    const buttons = () =>
      Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          ".draggable-popup__footer button",
        ),
      );
    expect(buttons()[1]!.disabled).toBe(true);
    buttons()[1]!.click();
    expect(w.emitted("ok")).toBeUndefined();
    await w.setProps({ confirmLoading: false });
    buttons()[1]!.click();
    expect(w.emitted("ok")).toHaveLength(1);
    expect(w.emitted("update:open")).toBeUndefined();
    expect(buttons()[0]!.textContent).toContain("Back");
    await w.setProps({ footer: null });
    expect(document.querySelector("footer")).toBeNull();
  });
  it("Drawer close carries the native event only on requests, afterOpenChange reports actual state", async () => {
    const afterOpenChange = vi.fn();
    const w = mount(DraggableDrawer, {
      props: {
        open: true,
        keyboard: false,
        closable: false,
        onAfterOpenChange: afterOpenChange,
      },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.querySelector('[aria-label="关闭面板"]')).toBeNull();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(w.emitted("close")).toBeUndefined();
    await w.setProps({ closable: true });
    document
      .querySelector<HTMLButtonElement>('[aria-label="关闭面板"]')!
      .click();
    expect(w.emitted("close")?.[0]?.[0]).toBeInstanceOf(MouseEvent);
    expect(w.emitted("close")).toHaveLength(1);
    await w.setProps({ open: false });
    await flushPromises();
    expect(w.emitted("close")).toHaveLength(1);
    expect(afterOpenChange.mock.calls).toEqual([[true], [false]]);
  });
  it("retains content by default in named variants, destroys with destroyOnClose and honors forceRender", async () => {
    const w = mount(DraggableDrawer, {
      props: { open: false, forceRender: true },
      slots: { default: "<input data-retained />" },
      attachTo: document.body,
    });
    await flushPromises();
    const input = document.querySelector<HTMLInputElement>("[data-retained]")!;
    expect(input).not.toBeNull();
    input.value = "retained";
    await w.setProps({ open: true });
    await w.setProps({ open: false });
    expect(document.querySelector("[data-retained]")).toBe(input);
    expect(input.value).toBe("retained");
    await w.setProps({ forceRender: false, destroyOnClose: true });
    expect(document.querySelector("[data-retained]")).toBeNull();
  });
  it("applies region styles, renders VNode props, and resolves getContainer/inline rendering", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const w = mount(DraggableDrawer, {
      props: {
        open: true,
        getContainer: () => target,
        mask: false,
        title: h("i", "VNode Title"),
        extra: () => h("span", "VNode Extra"),
        footer: () => h("button", "VNode Footer"),
        bodyStyle: { padding: "30px" },
        headerStyle: { height: "60px" },
        footerStyle: { padding: "20px" },
      },
      attachTo: document.body,
    });
    await flushPromises();
    const p = target.querySelector('[role="dialog"]')!;
    expect(p.textContent).toContain("VNode Title");
    expect(p.textContent).toContain("VNode Extra");
    expect(p.textContent).toContain("VNode Footer");
    expect(
      p.querySelector<HTMLElement>(".draggable-popup__body")!.style.padding,
    ).toBe("30px");
    await w.setProps({ getContainer: false });
    await nextTick();
    expect(target.querySelector('[role="dialog"]')).toBeNull();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
  it("restores body scroll only after the last mask closes and honors maskClosable", async () => {
    document.body.style.overflow = "auto";
    const a = mount(DraggableModal, {
      props: { open: true, maskClosable: false },
      attachTo: document.body,
    });
    const b = mount(DraggableDrawer, {
      props: { open: true },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.body.style.overflow).toBe("hidden");
    document.querySelector<HTMLElement>(".draggable-popup__mask")!.click();
    expect(a.emitted("update:open")).toBeUndefined();
    await a.setProps({ open: false });
    expect(document.body.style.overflow).toBe("hidden");
    await b.setProps({ open: false });
    expect(document.body.style.overflow).toBe("auto");
  });
});
