import { FALLBACK_CONNECTION, reduxDevtools } from './reduxDevtools';
import { DEFAULT_STORE_OPTIONS, Immutable, StoreActions, StoreOptions } from './store.types';
import { cloneDeep } from 'lodash';
import { randomUUID } from './utils';

/** Contains a copy of all the created stores */
export class CentralStore {
  /** A collection of all the created stores */
  private static readonly stores: Map<string, Store<any, any>> = new Map();

  static readonly globalStoreOptions = {
    failSilently: true,
  };

  protected static addStore(newStore: Store<any, any>): void {
    if (this.stores.has(newStore.name)) {
      return handleStoreError(
        `Store names must be unique. Found duplicate store name: "${newStore.name}"
        Possible Cause(s):
        1. The file that contains store: "${newStore.name}" was hot reloaded (if that's the case, then fear not 👍)`
      );
    }

    CentralStore.stores.set(newStore.name, newStore);
  }

  /**
   * Retrieve a specific Store instance by its name.
   *
   * @param storeName represents the name of the store instance to be retrieved.
   *
   * @returns a Store instance if a store with the given name exists. If no such store exists, it returns `undefined`.
   */
  static getStore(storeName: string): Store<any, any> | undefined {
    return this.stores.get(storeName);
  }

  /**
   * Returns an array of all Store instances.
   *
   * Each instance in the array represents a store that has been created.
   */
  static getAllStores(): Store<any, any>[] {
    return Array.from(this.stores.values());
  }
}

export class Store<
  StoreState,
  Actions extends StoreActions<StoreState> = StoreActions<StoreState>,
> extends CentralStore {
  private readonly reduxDevtoolsConnection: ReduxDevtoolsConnection;

  private readonly initialState: StoreState;

  private readonly storeListeners = new Map<
    string,
    (newState: Immutable<StoreState>, prevState: Immutable<StoreState>) => void
  >();

  /**
   * Creates a new {@link Store} instance.
   *
   * @param storeName - The name of the store.
   * @param storeState - The initial state of the store.
   * @param storeActions - The actions available for the store.
   * @param storeOptions - The options for configuring the store (optional).
   */
  constructor(
    private readonly storeName: string,
    private storeState: StoreState,
    private readonly storeActions: Actions,
    private readonly storeOptions: StoreOptions<StoreState> = DEFAULT_STORE_OPTIONS
  ) {
    super();

    this.initialState = cloneDeep(storeState);

    this.reduxDevtoolsConnection =
      this.storeOptions.debugStore && !!window?.__REDUX_DEVTOOLS_EXTENSION__
        ? reduxDevtools.connectStore({
            storeName: storeName,
            initialStoreState: this.storeState,
          })
        : FALLBACK_CONNECTION;
    this.reduxDevtoolsConnection.init(this.storeState);

    if (storeOptions.unserializeOnCreate) {
      if (storeOptions.unserializerAsync) {
        this.unserializeAsync();
      } else {
        this.unserialize();
      }
    }

    this.updateState.bind(this);

    CentralStore.addStore(this);
  }

  /**
   * The name of the store
   */
  get name(): string {
    return this.storeName;
  }

  /**
   * The current immutable state of the store
   */
  get state(): Immutable<StoreState> {
    return this.storeState as Immutable<StoreState>;
  }

  /**
   * The actions that can be dispatched to update the store state
   */
  get actions(): Actions {
    return this.storeActions;
  }

  /**
   * Used to dispatch an action to update the store state. The action is identified by a
   * unique key within the scope of the store
   *
   * @param actionKey a key that identifies the action to be dispatched
   * @param payLoadCallback a function that is given the current state of the store as an argument and returns the payload for the action. The payload must be of the type that the action expects.
   *
   * @returns the result of the dispatched action. The type of the result is determined by the ReturnType of the action identified by the actionKey
   */
  dispatch<T extends keyof Actions>(
    actionKey: T,
    payLoadCallback?: (storeState: Immutable<StoreState>) => Parameters<Actions[T]>[1]
  ): ReturnType<Actions[T]> {
    const payload = payLoadCallback?.(this.state);
    const action = this.storeActions[actionKey];

    return action(
      {
        state: this.state,
        updateState: newStoreState => this.updateStoreState(newStoreState, actionKey, payload),
        updateProperty: (key, value) => this.updateStoreProperty(key, value, actionKey, payload),
      },
      payload
    );
  }

  /**
   * Subscribes a callback function to changes in the store's state. The callback function is called with
   * the new and previous state of the store whenever the state changes.
   *
   * @param onStoreChangedCallback given the new state and the previous state of the store as arguments. It is called whenever the state of the store changes.
   * @returns
   */
  subscribeToStoreChange(
    onStoreChangedCallback: (newState: Immutable<StoreState>, prevState: Immutable<StoreState>) => void
  ): () => boolean {
    const id = randomUUID();
    this.storeListeners.set(id, onStoreChangedCallback);

    return () => {
      this.reduxDevtoolsConnection.unsubscribe();

      return this.storeListeners.delete(id);
    };
  }

  private isInputFunction(input: unknown): input is (state: Immutable<StoreState>) => Immutable<StoreState> {
    return typeof input === 'function';
  }

  private isPropertyInputFunction<T extends keyof StoreState>(
    input: unknown
  ): input is (state: Immutable<StoreState>) => StoreState[T] {
    return typeof input === 'function';
  }

  /**
   * Directly update the state of the store.
   *
   * @param state the new state of the store
   */
  updateState(state: Immutable<StoreState>): void;
  /**
   * Directly update the state of the store. The new state is provided by a
   * function that takes the current state and derives the new state.
   *
   * @param callback a function that takes the current state of the store and returns the new state
   */
  updateState(callback: (state: Immutable<StoreState>) => Immutable<StoreState>): void;
  updateState(input: Immutable<StoreState> | ((state: Immutable<StoreState>) => Immutable<StoreState>)): void {
    const newState = this.isInputFunction(input) ? input(this.state) : input;
    this.updateStoreState(newState, 'DIRECT_STORE_UPDATE', newState);
  }

  /** Directly update a property in the store state */
  updateProperty<T extends keyof StoreState>(key: T, value: StoreState[T]): void;
  /** Directly update a property in the store state using the current store state */
  updateProperty<T extends keyof StoreState>(key: T, callback: (state: Immutable<StoreState>) => StoreState[T]): void;
  updateProperty<T extends keyof StoreState>(
    key: T,
    input: StoreState[T] | ((state: Immutable<StoreState>) => StoreState[T])
  ): void;
  updateProperty<T extends keyof StoreState>(
    key: T,
    input: StoreState[T] | ((state: Immutable<StoreState>) => StoreState[T])
  ): void {
    const newValue = this.isPropertyInputFunction(input) ? input(this.state) : input;
    this.updateStoreProperty(key, newValue, 'DIRECT_STORE_PROPERTY_UPDATE', { [key]: newValue });
  }

  private updateStoreState(state: Immutable<StoreState>, actionKey: keyof Actions, payload: unknown): void {
    const prevState = structuredClone(this.state);
    this.storeState = state as StoreState;
    this.onStoreChanged(state, prevState, actionKey, payload);
  }

  private updateStoreProperty<T extends keyof StoreState>(
    key: T,
    value: StoreState[T],
    actionKey: keyof Actions,
    payload: unknown
  ) {
    const prevState = structuredClone(this.state);
    this.storeState[key] = value;
    this.onStoreChanged(this.state, prevState, actionKey, payload);
  }

  private onStoreChanged(
    newState: Immutable<StoreState>,
    prevState: Immutable<StoreState>,
    actionKey: keyof Actions,
    payload: unknown
  ) {
    this.storeListeners.forEach(callback => {
      callback(newState, prevState);
    });
    this.reduxDevtoolsConnection.send({ type: String(actionKey), payload }, newState);
    if (this.storeOptions.serializeOnUpdate) {
      if (this.storeOptions.serializerAsync) {
        this.serializeAsync();
      } else {
        this.serialize();
      }
    }
  }

  /** Reset store back to initial state */
  reset(): void {
    this.storeState = this.initialState;
  }

  /**
   * Persist store state.
   *
   * The serializer provided in {@link StoreOptions.serializer} will be used
   * to persist the current store state.
   *
   * ```localStorage?.setItem('storeName', JSON.stringify(storeState))``` will be used
   * as a fallback if {@link StoreOptions.serializer} is `undefined`
   *
   * @throws `Error` if {@link StoreOptions.serializer} and `localStorage?.setItem` are both `undefined`
   */
  serialize(): void {
    if (this.storeOptions.serializer) {
      return this.storeOptions.serializer(this.storeName, this.state);
    }

    if (localStorage?.setItem) {
      return localStorage.setItem(this.storeName, JSON.stringify(this.state));
    }

    handleStoreError(
      'Cannot serialize store state because "StoreOptions.serializer" and "localStorage.setItem" are both undefined'
    );
  }

  /**
   * Asynchronously persist store state.
   *
   * The serializer provided in {@link StoreOptions.serializerAsync} will be used
   * to persist the current store state.
   *
   * @throws `Error` if {@link StoreOptions.serializerAsync} is `undefined`
   */
  async serializeAsync(): Promise<void> {
    if (this.storeOptions.serializerAsync) {
      return this.storeOptions.serializerAsync(this.storeName, this.state);
    }

    handleStoreError('Cannot serialize store state because "StoreOptions.serializerAsync" is undefined');
  }

  /**
   * Initialize store state with persisted data.
   *
   * The serializer provided in {@link StoreOptions.unserializer} will be used
   * to persist the current store state.
   *
   * ```localStorage?.getItem('storeName')``` will be used
   * as a fallback if {@link StoreOptions.unserializer} is `undefined`
   *
   * @throws `Error` if {@link StoreOptions.unserializer} and `localStorage?.getItem` are both `undefined`
   */
  unserialize(): void {
    if (this.storeOptions.unserializer) {
      return this.updateState(
        this.validateStoreState(this.storeOptions.unserializer(this.storeName) as Immutable<StoreState>)
      );
    }

    if (localStorage?.getItem) {
      return this.updateState(this.validateStoreState(JSON.parse(localStorage.getItem(this.storeName)!)));
    }

    handleStoreError(
      'Cannot unserialize store state because "StoreOptions.unserializer" and "localStorage.getItem" are both undefined'
    );
  }

  /**
   * Creates a clone of the current store instance.
   *
   * @param cloneStoreName - The name of the cloned store.
   *
   * @returns A new {@link Store} instance with the cloned state, actions, and options.
   */
  clone(cloneStoreName: string) {
    return new Store(
      cloneStoreName,
      cloneDeep(this.storeState),
      cloneDeep(this.storeActions),
      cloneDeep(this.storeOptions)
    );
  }

  /**
   * Creates a clone of the store with the specified name and options.
   *
   * @param cloneStoreName - The name of the cloned store.
   * @param options - The options for the cloned store.
   *
   * @returns A new {@link Store} instance with the cloned state, actions, and options.
   */
  cloneWithOptions(cloneStoreName: string, options: StoreOptions<StoreState>) {
    return new Store(cloneStoreName, cloneDeep(this.storeState), cloneDeep(this.storeActions), options);
  }

  /**
   * Initialize store state with persisted data.
   *
   * The serializer provided in {@link StoreOptions.unserializerAsync} will be used
   * to persist the current store state.
   *
   * @throws `Error` if {@link StoreOptions.unserializerAsync} is `undefined`
   */
  async unserializeAsync(): Promise<void> {
    if (this.storeOptions.unserializerAsync) {
      return this.updateState(
        this.validateStoreState((await this.storeOptions.unserializerAsync(this.storeName)) as Immutable<StoreState>)
      );
    }

    handleStoreError('Cannot unserialize store state because "StoreOptions.unserializerAsync" is undefined');
  }

  private validateStoreState = (state: Immutable<StoreState>): Immutable<StoreState> => {
    if (!state) {
      handleStoreError(`${state} cannot be used to initialize store: ${this.storeName}`);

      return this.state;
    }

    return state;
  };
}

const handleStoreError = (message: string, handler: () => void = () => {}): void => {
  if (CentralStore.globalStoreOptions.failSilently) {
    console.warn(message);
    handler();
  } else {
    throw new Error(message);
  }
};
