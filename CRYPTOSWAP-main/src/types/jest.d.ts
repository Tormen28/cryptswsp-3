/// <reference types="jest" />

declare namespace jest {
  function fn(): jest.Mock;
  function useFakeTimers(): void;
  function clearAllMocks(): void;
  function clearAllTimers(): void;
}

declare function afterEach(fn: () => void): void;

interface Global {
  fetch: jest.Mock;
}

declare var global: Global; 