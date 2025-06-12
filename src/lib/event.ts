export type Event<Data> = (data: Data) => void;

export const create = <Data>() => {
  const listeners = new Set<Event<Data>>();

  return Object.assign(
    (data: Data) => {
      for (const listener of listeners) {
        listener(data);
      }
    },
    {
      watch: (listener: Event<Data>) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      }
    },
  );
};
