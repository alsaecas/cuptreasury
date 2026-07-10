export interface PaymentIntentConsumptionStore {
  isConsumed(intentId: string, nonce: string): Promise<boolean>;
  consumeAtomically(intentId: string, nonce: string): Promise<void>;
}

export interface LockingPaymentIntentConsumptionStore
  extends PaymentIntentConsumptionStore {
  runExclusive<T>(
    intentId: string,
    nonce: string,
    operation: () => Promise<T>,
  ): Promise<T>;
}

export class PaymentIntentAlreadyConsumedError extends Error {
  constructor(
    readonly intentId: string,
    readonly nonce: string,
  ) {
    super(`PaymentIntent ${intentId}:${nonce} has already been consumed.`);
    this.name = "PaymentIntentAlreadyConsumedError";
  }
}

export class InMemoryPaymentIntentConsumptionStore
  implements LockingPaymentIntentConsumptionStore
{
  private readonly consumed = new Set<string>();
  private readonly locks = new Map<string, Promise<unknown>>();

  async isConsumed(intentId: string, nonce: string): Promise<boolean> {
    return this.consumed.has(keyFor(intentId, nonce));
  }

  async consumeAtomically(intentId: string, nonce: string): Promise<void> {
    const key = keyFor(intentId, nonce);

    if (this.consumed.has(key)) {
      throw new PaymentIntentAlreadyConsumedError(intentId, nonce);
    }

    this.consumed.add(key);
  }

  async runExclusive<T>(
    intentId: string,
    nonce: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const key = keyFor(intentId, nonce);
    const previous = this.locks.get(key) ?? Promise.resolve();

    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    const tail = previous
      .catch(() => undefined)
      .then(() => current);

    this.locks.set(key, tail);

    await previous.catch(() => undefined);

    try {
      return await operation();
    } finally {
      release();

      if (this.locks.get(key) === tail) {
        this.locks.delete(key);
      }
    }
  }
}

export function keyFor(intentId: string, nonce: string): string {
  return `${intentId}:${nonce}`;
}

export async function runWithConsumptionLock<T>(
  store: PaymentIntentConsumptionStore | undefined,
  intentId: string,
  nonce: string,
  operation: () => Promise<T>,
): Promise<T> {
  if (isLockingStore(store)) {
    return store.runExclusive(intentId, nonce, operation);
  }

  return operation();
}

function isLockingStore(
  store: PaymentIntentConsumptionStore | undefined,
): store is LockingPaymentIntentConsumptionStore {
  return (
    store !== undefined &&
    "runExclusive" in store &&
    typeof store.runExclusive === "function"
  );
}
