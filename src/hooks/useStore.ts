import { useEffect, useState } from 'react';
import { Immutable, StoreActions } from '../store.types';
import { Store } from '../store';

/**
 * Subscribe to changes in store
 */
export const useStore = <StoreState, Actions extends StoreActions<StoreState>>(
  store: Store<StoreState, Actions>
): Immutable<StoreState> => {
  const [storeState, setStoreState] = useState(store.state);

  useEffect(() => {
    const unsubscribe = store.subscribeToStoreChange(newState => setStoreState(newState));

    return () => {
      unsubscribe();
    };
  }, []);

  return storeState;
};
