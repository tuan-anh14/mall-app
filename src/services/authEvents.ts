type Handler = () => void;

let onUnauthenticated: Handler | null = null;

export const authEvents = {
  setOnUnauthenticated: (cb: Handler): void => {
    onUnauthenticated = cb;
  },
  emitUnauthenticated: (): void => {
    onUnauthenticated?.();
  },
};
