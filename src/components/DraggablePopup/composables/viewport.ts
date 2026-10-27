/** Layout viewport's usable area; innerWidth/Height include classic scrollbars. */
export function viewportSize() {
  const root = document.documentElement;
  return {
    width: root.clientWidth || window.innerWidth,
    height: root.clientHeight || window.innerHeight,
  };
}
