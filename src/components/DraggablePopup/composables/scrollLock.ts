// A document-level resource shared by masks; geometry/state remain instance-local.
const locks = new WeakMap<
  Document,
  { owners: Set<symbol>; overflow: string }
>();
export function lockBody(doc: Document) {
  let state = locks.get(doc);
  if (!state) {
    state = { owners: new Set(), overflow: doc.body.style.overflow };
    locks.set(doc, state);
  }
  const owner = Symbol();
  state.owners.add(owner);
  doc.body.style.overflow = "hidden";
  return () => {
    state.owners.delete(owner);
    if (!state.owners.size) {
      doc.body.style.overflow = state.overflow;
      locks.delete(doc);
    }
  };
}
