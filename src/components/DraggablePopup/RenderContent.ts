import type { PanelContent } from "./types";
export default function RenderContent(props: { value?: PanelContent }) {
  return typeof props.value === "function" ? props.value() : props.value;
}
