import { useEffect, useState } from 'react';
import { Immutable, StoreActions } from '../store.types';
import { Store } from '../store';

/**
 * Subscribe to changes in store
 */
export const useStore = <StoreState, Actions extends StoreActions<StoreState>>(
  store: Store<StoreState, Actions>
): [Immutable<StoreState>, Store<StoreState, Actions>['updateState']] => {
  const [storeState, setStoreState] = useState(store.state);

  useEffect(() => {
    const unsubscribe = store.subscribeToStoreChange(newState => setStoreState(newState));

    return () => {
      unsubscribe();
    };
  }, []);

  return [storeState, store.updateState.bind(store)];
};
