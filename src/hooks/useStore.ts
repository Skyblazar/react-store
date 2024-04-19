import { useEffect, useState } from 'react';
import { Immutable, StoreActions } from '../store.types';
import { Store } from '../store';

/**
 * A React hook that is used to connect a React component to a store. It takes a store as an argument
 * and returns the current state of the store and a function to update the state of the store.
 *
 * @param store an instance of the Store class. The store contains the state that the React component should be connected to and the actions (optional) that can be dispatched to the store
 *
 * @returns an array with two elements:
 *  - The current immutable state of the store.
 *  - A function that can be used to update the state of the store
 *
 * @example
 * ```tsx
 * const myStore = new Store('myStore', { myProperty: 0 });
 *
 * export const MyComponent: React.FC = () => {
 *   const [state, setState] = useStore(myStore);
 *
 *   return (
 *     <div
 *       onClick={() => setState({ myProperty: 100 })}
 *       onDoubleClick={() => setState(state => ({ ...state, myProperty: -1000 }))}>
 *       {state.myProperty}
 *     </div>
 *   );
 * }
 * ```
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
