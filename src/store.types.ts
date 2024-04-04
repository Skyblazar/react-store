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

// Constants

export type StoreCallback<StoreState, T extends keyof StoreState> = (value: Immutable<StoreState[T]>) => StoreState[T];

interface SubStore<StoreState> {
  state: Immutable<StoreState>;
  updateState: (newStoreState: Immutable<StoreState>) => void;
  updateProperty: <T extends keyof StoreState>(key: T, value: StoreState[T]) => void;
}

export type StoreActions<StoreState> = Record<
  string,
  (payload: AllowedAny, subStore: SubStore<StoreState>) => AllowedAny
>;

export interface StoreOptions {
  /** Enable/Disable debugging with redux devtools extension. Defaults to `false` */
  debugStore: boolean;
}

export const DEFAULT_STORE_OPTIONS: StoreOptions = { debugStore: false };
