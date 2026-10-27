export interface FrameClock {
  request(callback: () => void): number;
  cancel(id: number): void;
}

/** Coalesce visual commits, but synchronously flush the final sample on finish. */
export function createFramePublisher<T>(
  commit: (value: T) => void,
  clock?: FrameClock,
) {
  let frame: number | undefined,
    pending: T | undefined,
    hasPending = false;
  function flush() {
    if (frame !== undefined) {
      clock?.cancel(frame);
      frame = undefined;
    }
    if (!hasPending) return;
    const value = pending as T;
    pending = undefined;
    hasPending = false;
    commit(value);
  }
  function cancel() {
    if (frame !== undefined) clock?.cancel(frame);
    frame = undefined;
    pending = undefined;
    hasPending = false;
  }
  function queue(value: T) {
    pending = value;
    hasPending = true;
    if (!clock) {
      flush();
      return;
    }
    if (frame === undefined)
      frame = clock.request(() => {
        frame = undefined;
        flush();
      });
  }
  return { queue, flush, cancel };
}
