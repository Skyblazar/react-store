interface ConnectStoreParams<T> {
  storeName: string;
  initialStoreState: T;
}

const noOp = () => {};

export const FALLBACK_CONNECTION: ReduxDevtoolsConnection = {
  init: noOp,
  subscribe: () => noOp,
  send: noOp,
  unsubscribe: noOp,
  error: noOp,
};

class ReduxDevtools<T> {
  connectStore({ storeName, initialStoreState }: ConnectStoreParams<T>): ReduxDevtoolsConnection {
    const reduxDevtoolsConnection = window.__REDUX_DEVTOOLS_EXTENSION__?.connect({
      name: storeName,
    });
    reduxDevtoolsConnection?.init(initialStoreState);

    return reduxDevtoolsConnection ?? FALLBACK_CONNECTION;
  }
}

export const reduxDevtools = new ReduxDevtools();
