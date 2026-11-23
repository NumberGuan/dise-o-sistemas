import { useSyncExternalStore } from "react";

export type Store<T> = {
  get: () => T;
  set: (updater: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
};

export const createStore = <T,>(initial: T): Store<T> => {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    set: (updater) => {
      state =
        typeof updater === "function"
          ? (updater as (prev: T) => T)(state)
          : updater;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export const useStore = <T,>(store: Store<T>): T =>
  useSyncExternalStore(store.subscribe, store.get, store.get);