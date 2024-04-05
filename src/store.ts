import { randomUUID } from 'crypto';
import { FALLBACK_CONNECTION, reduxDevtools } from './reduxDevtools';
import { DEFAULT_STORE_OPTIONS, Immutable, StoreActions } from './store.types';

export class Store<StoreState, Actions extends StoreActions<StoreState>> {
  private readonly reduxDevtoolsConnection: ReduxDevtoolsConnection;

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
      updateState: newStoreState => this.updateState(newStoreState, actionKey, payload),
      updateProperty: (key, value) => this.updateProperty(key, value, actionKey, payload),
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

  private updateState(state: Immutable<StoreState>, actionKey: keyof Actions, payload: unknown) {
    const prevState = structuredClone(this.state);
    this.storeState = state as StoreState;
    this.onStoreChanged(state, prevState, actionKey, payload);
  }

  private updateProperty<T extends keyof StoreState>(
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
    this.reduxDevtoolsConnection.send({ type: String(actionKey), payload: payload }, newState);
  }
}
