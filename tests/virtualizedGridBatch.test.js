import { VirtualizedGrid } from '../modules/virtualizedGrid.js';

describe('VirtualizedGrid Frame Budgeting & Batch Rendering (#2962)', () => {
  let mockContainer;

  beforeEach(() => {
    mockContainer = {
      clientWidth: 1000,
      getBoundingClientRect: () => ({ top: 0, left: 0, width: 1000, height: 600 }),
      innerHTML: '',
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    global.window = {
      innerHeight: 800,
      scrollY: 0,
      addEventListener: () => {},
      removeEventListener: () => {},
      requestAnimationFrame: (cb) => cb(),
    };
  });

  test('instantiates VirtualizedGrid and performs batched render pass without throwing', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i, title: `Problem ${i}` }));
    const grid = new VirtualizedGrid({
      container: mockContainer,
      items,
      renderItem: (item) => `<div class="problem-card" data-id="${item.id}">${item.title}</div>`,
    });

    expect(grid).toBeTruthy();
    expect(mockContainer.innerHTML).toContain('Problem 0');
    grid.destroy();
  });
});
