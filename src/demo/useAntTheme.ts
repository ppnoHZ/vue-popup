import { watchEffect } from "vue";
import { theme } from "ant-design-vue";

/** Demo-only bridge: Ant Design Vue v4 tokens are JS values, not automatic CSS vars.
 * Publish on the document root so Teleport panels share the same theme.
 */
export function useAntTheme() {
  const { token } = theme.useToken();
  watchEffect((onCleanup) => {
    const t = token.value;
    const values: Record<string, string> = {
      "color-primary": t.colorPrimary,
      "color-primary-bg": t.colorPrimaryBg,
      "color-bg-layout": t.colorBgLayout,
      "color-bg-container": t.colorBgContainer,
      "color-bg-elevated": t.colorBgElevated,
      "color-bg-mask": t.colorBgMask,
      "color-error": t.colorError,
      "color-border": t.colorBorder,
      "color-border-secondary": t.colorBorderSecondary,
      "color-text": t.colorText,
      "color-text-heading": t.colorTextHeading,
      "color-text-secondary": t.colorTextSecondary,
      "color-text-tertiary": t.colorTextTertiary,
      "color-text-quaternary": t.colorTextQuaternary,
      "color-fill-content": t.colorFillContent,
      "color-fill-content-hover": t.colorFillContentHover,
      "color-fill-alter": t.colorFillAlter,
      "border-radius": `${t.borderRadius}px`,
      "border-radius-sm": `${t.borderRadiusSM}px`,
      "border-radius-lg": `${t.borderRadiusLG}px`,
      "box-shadow-secondary": t.boxShadowSecondary,
      "font-family": t.fontFamily,
      "font-size": `${t.fontSize}px`,
      "font-size-lg": `${t.fontSizeLG}px`,
      "line-height": String(t.lineHeight),
      "motion-duration-mid": t.motionDurationMid,
    };
    const style = document.documentElement.style;
    const previous = Object.keys(values).map((key) => {
      const name = `--ant-${key}`;
      return {
        name,
        value: style.getPropertyValue(name),
        priority: style.getPropertyPriority(name),
      };
    });
    for (const [key, value] of Object.entries(values))
      style.setProperty(`--ant-${key}`, value);
    onCleanup(() => {
      for (const { name, value, priority } of previous) {
        if (value) style.setProperty(name, value, priority);
        else style.removeProperty(name);
      }
    });
  });
}
