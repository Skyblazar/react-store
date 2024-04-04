interface ReduxAction {
  type: string;
  payload?: unknown;
}

interface ReduxDevtoolsExtension {
  connect: (config: {
    instanceId?: number;
    name?: string;
    serialize?: boolean;
    actionCreators?: Record<string, (...args: unknown[]) => unknown>;
    latency?: number;
    predicate?: (state: Record<string, unknown>, action: ReduxAction) => boolean;
    autoPause?: boolean;
    stateSanitizer?: (state: Record<string, unknown>) => unknown;
    getActionType?: (action: ReduxAction) => string | { action: ReduxAction; timestamp: number };
    actionSanitizer?: (action: ReduxAction) => ReduxAction;
    features?: unknown;
    type?: string;
  }) => {
    init: (state: unknown, liftedData?: unknown[]) => void;
    subscribe: (
      listener: (data: {
        id?: string;
        type: string;
        source: string;
        payload?: { type: string; actionId?: number; timestamp?: number };
        state?: string;
      }) => void
    ) => () => void;
    unsubscribe: () => void;
    send: (action: ReduxAction, state: unknown) => void;
    error: (payload: Record<string, unknown>) => void;
  };
}

interface Window {
  readonly __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevtoolsExtension;
}

type ReduxDevtoolsConnection = ReturnType<ReduxDevtoolsExtension['connect']>;
