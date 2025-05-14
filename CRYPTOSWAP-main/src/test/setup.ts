import '@testing-library/jest-dom/extend-expect';

// Mock de fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock de setTimeout y setInterval
jest.useFakeTimers();

// Limpiar mocks después de cada prueba
afterEach(() => {
  mockFetch.mockClear();
  jest.clearAllMocks();
  jest.clearAllTimers();
}); 