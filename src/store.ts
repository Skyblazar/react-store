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

  /** Directly update the store state */
  updateState(state: Immutable<StoreState>): void {
    this.updateStoreState(state, 'DIRECT_STORE_UPDATE', state);
  }

  /** Directly update a property in the store state */
  updateProperty<T extends keyof StoreState>(key: T, value: StoreState[T]) {
    this.updateStoreProperty(key, value, 'DIRECT_STORE_PROPERTY_UPDATE', { [key]: value });
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
