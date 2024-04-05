import { CentralStore, Store } from '../store';

describe('BaseStore', () => {
  const store1 = new Store('store1', { count: 0 }, {});
  const store2 = new Store('store2', { count: 100 }, {});
  const store3 = new Store('store3', { count: 1000 }, {});

  it('keeps track of all new store instances', () => {
    expect(CentralStore.getStore('store1')).toBe(store1);
    expect(CentralStore.getStore('store2')).toBe(store2);
    expect(CentralStore.getStore('store3')).toBe(store3);
  });
});
