type ImmutablePrimitive = undefined | null | boolean | string | number | Function;
export type ImmutableArray<T> = ReadonlyArray<Immutable<T>>;
export type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
export type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
export type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> };

export type Immutable<T> = T extends ImmutablePrimitive
  ? T
  : T extends Array<infer U>
    ? ImmutableArray<U>
    : T extends Map<infer K, infer V>
      ? ImmutableMap<K, V>
      : T extends Set<infer M>
        ? ImmutableSet<M>
        : ImmutableObject<T>;

/** Use with caution */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AllowedAny = any;

export type StoreCallback<StoreState, T extends keyof StoreState> = (value: Immutable<StoreState[T]>) => StoreState[T];

interface SubStore<StoreState> {
  state: Immutable<StoreState>;
  updateState: (newStoreState: Immutable<StoreState>) => void;
  updateProperty: <T extends keyof StoreState>(key: T, value: StoreState[T]) => void;
}

export type StoreActions<StoreState> = Record<
  string,
  (subStore: SubStore<StoreState>, payload: AllowedAny) => AllowedAny
>;

/**
 * Options from store.
 *
 * Custom properties and functions can be added as store options
 * */
export interface StoreOptions<StoreState> extends Record<string, AllowedAny> {
  /**
   * Enable/Disable debugging with redux devtools extension
   *
   * @default false
   */
  debugStore?: boolean;
  /**
   * Convert and persist store state on update. Persistence is implemented by {@link StoreOptions.serializer} or {@link StoreOptions.serializerAsync}
   *
   * @default false
   */
  serializeOnUpdate?: boolean;
  /**
   * Initialize store with persisted data. Data is unserialized by {@link StoreOptions.unserializer} or {@link StoreOptions.unserializerAsync}
   *
   * @default false
   */
  unserializeOnCreate?: boolean;
  /**
   * Function to persist store state.
   *
   * @fallback ```localStorage.setItem('storeName', JSON.stringify(storeState))```
   */
  serializer?: (storeName: string, storeState: Immutable<StoreState>) => void;
  /**
   * Async function to persist store state.
   */
  serializerAsync?: (storeName: string, storeState: Immutable<StoreState>) => Promise<void>;
  /**
   * Function to initialize store state with persisted data.
   *
   * @fallback ```JSON.parse(localStorage?.getItem(storeName))```
   */
  unserializer?: (storeName: string) => StoreState;
  /**
   * Async function to initialize store state with persisted data.
   */
  unserializerAsync?: (storeName: string) => Promise<StoreState>;
}

export const DEFAULT_STORE_OPTIONS: Readonly<StoreOptions<AllowedAny>> = {
  debugStore: false,
};
