type Timer = { start: () => void; end: () => number };

export function createTimer(): Timer {
  let timeStart: [number, number];

  return {
    start: () => {
      timeStart = process.hrtime();
    },
    end: () => {
      const NS_PER_SEC = 1e9;
      const NS_TO_MS = 1e6;
      const diff = process.hrtime(timeStart);

      return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
    },
  };
}
