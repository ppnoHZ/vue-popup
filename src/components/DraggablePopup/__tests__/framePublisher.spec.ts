import { describe, it, expect, vi } from "vitest";
import {
  createFramePublisher,
  type FrameClock,
} from "../composables/framePublisher";
function clock() {
  let next = 0;
  const callbacks = new Map<number, () => void>();
  const scheduler: FrameClock = {
    request: (callback) => {
      callbacks.set(++next, callback);
      return next;
    },
    cancel: (id) => {
      callbacks.delete(id);
    },
  };
  return {
    scheduler,
    tick() {
      const work = [...callbacks.values()];
      callbacks.clear();
      work.forEach((fn) => fn());
    },
    get pending() {
      return callbacks.size;
    },
  };
}
describe("frame publishing", () => {
  it("commits only the latest of a burst once per frame", () => {
    const c = clock(),
      commit = vi.fn(),
      publisher = createFramePublisher(commit, c.scheduler);
    for (let i = 0; i < 100; i++) publisher.queue(i);
    expect(c.pending).toBe(1);
    expect(commit).not.toHaveBeenCalled();
    c.tick();
    expect(commit.mock.calls).toEqual([[99]]);
  });
  it("flushes the last input synchronously on finish and cancels its scheduled frame", () => {
    const c = clock(),
      commit = vi.fn(),
      publisher = createFramePublisher(commit, c.scheduler);
    publisher.queue(1);
    publisher.queue(2);
    publisher.flush();
    expect(commit.mock.calls).toEqual([[2]]);
    expect(c.pending).toBe(0);
    c.tick();
    publisher.flush();
    expect(commit).toHaveBeenCalledTimes(1);
  });
  it("discards cancelled work and can queue again", () => {
    const c = clock(),
      commit = vi.fn(),
      publisher = createFramePublisher(commit, c.scheduler);
    publisher.queue(1);
    publisher.cancel();
    c.tick();
    expect(commit).not.toHaveBeenCalled();
    publisher.queue(2);
    c.tick();
    expect(commit.mock.calls).toEqual([[2]]);
  });
  it("preserves a newly queued sample when a commit triggers another update", () => {
    const c = clock(),
      received: number[] = [];
    const publisher = createFramePublisher<number>((value) => {
      received.push(value);
      if (value === 1) publisher.queue(2);
    }, c.scheduler);
    publisher.queue(1);
    c.tick();
    expect(received).toEqual([1]);
    expect(c.pending).toBe(1);
    c.tick();
    expect(received).toEqual([1, 2]);
  });
  it("falls back to immediate commits without an animation clock", () => {
    const commit = vi.fn(),
      publisher = createFramePublisher(commit);
    publisher.queue(3);
    expect(commit.mock.calls).toEqual([[3]]);
  });
});
