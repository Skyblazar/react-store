import { randomUUID } from 'crypto';
import { FALLBACK_CONNECTION, reduxDevtools } from './reduxDevtools';
import { DEFAULT_STORE_OPTIONS, Immutable, StoreActions } from './store.types';

/** Contains a copy of all the created stores */
export class CentralStore {
  /** A list of all the created stores */
  private static readonly stores: Store<any, any>[] = [];

  constructor() {
    const newStore = this as unknown as Store<any, any>;
    CentralStore.stores.push(newStore);
  }

  static getStore(storeName: string) {
    return this.stores.find(store => store.name === storeName);
  }
}

export class Store<StoreState, Actions extends StoreActions<StoreState>> extends CentralStore {
  private readonly reduxDevtoolsConnection: ReduxDevtoolsConnection;

  private readonly initialState: StoreState;

  private readonly storeListeners = new Map<
    string,
    (newState: Immutable<StoreState>, prevState: Immutable<StoreState>) => void
  >();

  constructor(
    private storeName: string,
    private storeState: StoreState,
    private storeActions: Actions,
    private storeOptions = DEFAULT_STORE_OPTIONS
  ) {
    super();

    this.initialState = storeState;

    this.reduxDevtoolsConnection =
      this.storeOptions.debugStore && !!window?.__REDUX_DEVTOOLS_EXTENSION__
        ? reduxDevtools.connectStore({
            storeName: storeName,
            initialStoreState: this.storeState,
          })
        : FALLBACK_CONNECTION;
    this.reduxDevtoolsConnection.init(this.storeState);

    this.updateState.bind(this);
  }

  get name() {
    return this.storeName;
  }

  get state(): Immutable<StoreState> {
    return this.storeState as Immutable<StoreState>;
  }

  get actions() {
    return this.storeActions;
  }

  dispatch<T extends keyof Actions>(
    actionKey: T,
    payLoadCallback: (storeState: Immutable<StoreState>) => Parameters<Actions[T]>[0]
  ): ReturnType<Actions[T]> {
    const payload = payLoadCallback(this.state);
    const action = this.storeActions[actionKey];

    return action(payload, {
      state: this.state,
      updateState: newStoreState => this.updateStoreState(newStoreState, actionKey, payload),
      updateProperty: (key, value) => this.updateStoreProperty(key, value, actionKey, payload),
    });
  }

  subscribeToStoreChange(
    onStoreChangedCallback: (newState: Immutable<StoreState>, prevState: Immutable<StoreState>) => void
  ) {
    const id = randomUUID();
    this.storeListeners.set(id, onStoreChangedCallback);

    return () => {
      this.reduxDevtoolsConnection.unsubscribe();

      return this.storeListeners.delete(id);
    };
  }

  isInputFunction(input: unknown): input is (state: Immutable<StoreState>) => Immutable<StoreState> {
    return typeof input === 'function';
  }

  isPropertyInputFunction<T extends keyof StoreState>(
    input: unknown
  ): input is (state: Immutable<StoreState>) => StoreState[T] {
    return typeof input === 'function';
  }

  /** Directly update the store state using the current store state */
  updateState(callback: (state: Immutable<StoreState>) => Immutable<StoreState>): void;
  /** Directly update the store state */
  updateState(state: Immutable<StoreState>): void;
  updateState(input: Immutable<StoreState> | ((state: Immutable<StoreState>) => Immutable<StoreState>)): void {
    const newState = this.isInputFunction(input) ? input(this.state) : input;
    this.updateStoreState(newState, 'DIRECT_STORE_UPDATE', newState);
  }

  /** Directly update a property in the store state using the current store state */
  updateProperty<T extends keyof StoreState>(key: T, callback: (state: Immutable<StoreState>) => StoreState[T]): void;
  /** Directly update a property in the store state */
  updateProperty<T extends keyof StoreState>(key: T, value: StoreState[T]): void;
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
  }

  /** Reset store back to initial state */
  reset() {
    this.storeState = this.initialState;
  }
}
