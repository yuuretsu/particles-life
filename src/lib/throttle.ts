export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
) => {
  let lastExec = 0;
  let result: ReturnType<T>;

  return function (...args: Parameters<T>): ReturnType<T> {
    const curTime = Date.now();

    if (curTime - lastExec > delay) {
      lastExec = curTime;
      result = func(...args);
    }
    return result;
  };
};
