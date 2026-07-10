export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export function fixedClock(date: Date): Clock {
  return {
    now: () => new Date(date.getTime()),
  };
}

export function mutableClock(initial: Date): Clock & { set(date: Date): void } {
  let current = new Date(initial.getTime());

  return {
    now: () => new Date(current.getTime()),
    set(date: Date) {
      current = new Date(date.getTime());
    },
  };
}
