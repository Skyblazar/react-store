import path from 'path';
import { CentralStore, Store } from '../store';
import { readFile, writeFile } from 'fs/promises';

describe('BaseStore', () => {
  const store1 = new Store('store1', { count: 0 }, {});
  const store2 = new Store('store2', { count: 100 }, {});
  const store3 = new Store('store3', { count: 1000 }, {});

  const storeFile = (storeName: string) => path.join(__dirname, `${storeName}.test.json`);

  let store: Store<{ count: number; name: string }>;

  beforeEach(() => {
    store = new Store(
      'store',
      { count: 0, name: 'counting' },
      {},
      {
        serializerAsync: (storeName, storeState) => writeFile(storeFile(storeName), JSON.stringify(storeState)),
        unserializerAsync: async storeName => {
          const data = await readFile(storeFile(storeName), 'utf-8');
          return JSON.parse(data);
        },
      }
    );
  });

  it('keeps track of all new store instances', () => {
    expect(CentralStore.getStore('store1')).toBe(store1);
    expect(CentralStore.getStore('store2')).toBe(store2);
    expect(CentralStore.getStore('store3')).toBe(store3);

    expect(CentralStore.getAllStores()).toEqual([store1, store2, store3, store]);
  });

  it('serializes/unserializes store', async () => {
    await store.serializeAsync();

    store.updateState({ count: 100000, name: 'Temporary Name' });
    expect(store.state).toEqual({ count: 100000, name: 'Temporary Name' });

    await store.unserializeAsync();
    expect(store.state).toEqual({ count: 0, name: 'counting' });
  });
});
