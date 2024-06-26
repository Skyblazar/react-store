import path from 'path';
import { CentralStore, Store } from '../store';
import { readFile, writeFile, rm } from 'fs/promises';
import { randomUUID } from '../utils';
import { StoreOptions } from '../store.types';

describe('Store', () => {
  const store1 = new Store('store1', { count: 0 }, {});
  const store2 = new Store('store2', { count: 100 }, {});
  const store3 = new Store('store3', { count: 1000 }, {});

  const storeFile = (storeName: string) => path.join(__dirname, `${storeName}.test.json`);

  let store: Store<{ count: number; name: string }>;

  const cloneStoreNamePrefix = 'cloneStore';
  const storeOptions: StoreOptions<{ count: number; name: string }> = {
    serializerAsync: (storeName, storeState) => writeFile(storeFile(storeName), JSON.stringify(storeState)),
    unserializerAsync: async storeName => {
      const data = await readFile(storeFile(storeName), 'utf-8');
      return JSON.parse(data);
    },
  };

  beforeEach(() => {
    store = new Store(`store-${randomUUID()}`, { count: 0, name: 'counting' }, {}, storeOptions);
  });

  describe('CentralStore', () => {
    it('keeps track of all new store instances', () => {
      expect(CentralStore.getStore('store1')).toBe(store1);
      expect(CentralStore.getStore('store2')).toBe(store2);
      expect(CentralStore.getStore('store3')).toBe(store3);

      expect(CentralStore.getAllStores()).toEqual([store1, store2, store3, store]);
    });

    it('sets global store options', () => {
      expect(CentralStore.globalStoreOptions.failSilently).toBe(true);

      CentralStore.globalStoreOptions.failSilently = false;
      expect(CentralStore.globalStoreOptions.failSilently).toBe(false);

      CentralStore.globalStoreOptions.failSilently = true;
    });

    it('handle duplicate', () => {
      const store1 = new Store('storeN', { count: 0 }, {});
      const store2 = new Store('storeN', { count: -1000 }, {});
      const store3 = new Store('storeN', { count: 1000, counter: 2000, name: 'test' }, {});

      expect(store1).toBe(store1);
      expect(store1.state).toEqual({ count: 0 });
      expect(store2).toEqual(store1);
      expect(store2.state).toEqual({ count: 0 });
      expect(store3).toBe(store1);
      expect(store3.state).toEqual({ count: 0 });
    });
  });

  describe('MainStore', () => {
    describe('.serialize*() and unserialize*()', () => {
      it('serializes/unserializes store', async () => {
        await store.serializeAsync();

        store.updateState({ count: 100000, name: 'Temporary Name' });
        expect(store.state).toEqual({ count: 100000, name: 'Temporary Name' });

        await store.unserializeAsync();
        expect(store.state).toEqual({ count: 0, name: 'counting' });

        await rm(storeFile(store.name));
      });

      it.skip('serializes on update', async () => {
        const storeSerializeSpy = jest.spyOn(store, 'serialize');
        store.updateProperty('count', 1000);
        expect(storeSerializeSpy).toHaveBeenCalled();

        await rm(storeFile(store.name));
      });
    });

    describe('.clone()', () => {
      const cloneStoreNamePrefix = 'cloneStore';
      it('clones store', () => {
        const cloneStoreName = `${cloneStoreNamePrefix}-${randomUUID()}`;
        const cloneStore = store.clone(cloneStoreName);

        expect(cloneStore.name).toEqual(cloneStoreName);
        expect(cloneStore.state).toEqual(store.state);
        expect(cloneStore.actions).toEqual(store.actions);
      });

      it('does not link cloned store state', () => {
        const cloneStoreName = `${cloneStoreNamePrefix}-${randomUUID()}`;
        const cloneStore = store.clone(cloneStoreName);

        expect(store.state.count).toEqual(0);
        expect(cloneStore.state.count).toEqual(0);

        store.updateProperty('count', -1);
        expect(store.state.count).toEqual(-1);
        expect(cloneStore.state.count).toEqual(0);

        cloneStore.updateProperty('count', -100);
        expect(cloneStore.state.count).toEqual(-100);
        expect(store.state.count).toEqual(-1);
      });
    });

    describe('.cloneWithOptions()', () => {
      it('clones store with provided options', () => {
        const cloneStoreName = `${cloneStoreNamePrefix}-${randomUUID()}`;
        const serializer = jest.fn();
        const cloneStore = store.cloneWithOptions(cloneStoreName, { serializeOnUpdate: true, serializer });
        const storeSerializeSpy = jest.spyOn(store, 'serialize');
        const cloneStoreSerializeSpy = jest.spyOn(cloneStore, 'serialize');

        store.updateProperty('count', -1);
        // serializeOnUpdate not set to true, serialization will not be done on update
        expect(storeSerializeSpy).not.toHaveBeenCalled();

        cloneStore.updateProperty('count', -1);
        expect(cloneStoreSerializeSpy).toHaveBeenCalled();
        expect(serializer).toHaveBeenCalledWith(cloneStoreName, cloneStore.state);
      });
    });

    describe('.reset()', () => {
      it('resets store state', () => {
        store.updateProperty('count', 100);
        expect(store.state.count).toEqual(100);

        store.reset();
        expect(store.state.count).toEqual(0);
      });
    });
  });
});
