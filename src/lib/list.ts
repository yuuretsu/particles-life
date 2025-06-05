export const generate = <T>(length: number, fn: (index: number) => T): T[] => {
  return Array.from({ length }, (_, index) => {
    return fn(index);
  });
};
