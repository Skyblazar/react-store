import { useEffect, useState } from 'react';
import { Immutable, StoreActions } from '../store.types';
import { Store } from '../store';
import { isEqual } from 'lodash';

/**
 * A React hook that is used to connect a React component to a specific property of a store's state.
 * It takes a store, a function to select a property from the store's state, and a key of the property as arguments.
 * It returns the current value of the selected property and a function to update the value of the property.
 *
 * @param store an instance of the Store class. The store contains the state that the React component should be connected to and the actions (optional) that can be dispatched to the store
 * @param selectPropertyFn a function that is given the state of the store as an argument and returns the value of the selected property.
 * @param propertyKey the key of the property that should be updated.
 *
 * @returns an array with two elements:
 *  - The current value of the selected property from the store's state.
 *  - A function that can be used to update the value of the selected property in the store's state.
 *
 * @example
 * ```tsx
 * const myStore = new Store('myStore', { myProperty: 0 });
 *
 * export const MyComponent: React.FC = () => {
 *   const [myProperty, setMyProperty] = useStoreProperty(myStore, state => state.myProperty, 'myProperty');
 *
 *   return (
 *     <div
 *       onClick={() => setMyProperty(1000)}
 *       onDoubleClick={() => setMyProperty(state => state.myProperty - 1000)}>
 *       {myProperty}
 *     </div>
 *   );
 * }
 * ```
 */
export const useStoreProperty = <
  StoreState,
  Actions extends StoreActions<StoreState>,
  ValueType,
  PropertyKey extends keyof StoreState,
>(
  store: Store<StoreState, Actions>,
  selectPropertyFn: (storeState: Store<StoreState, Actions>['state']) => Immutable<ValueType>,
  propertyKey: PropertyKey
): [
  Immutable<ValueType>,
  (input: StoreState[PropertyKey] | ((state: Immutable<StoreState>) => StoreState[PropertyKey])) => void,
] => {
  const [propertyValue, setPropertyValue] = useState(selectPropertyFn(store.state));

  const updateState = (
    input: StoreState[PropertyKey] | ((state: Immutable<StoreState>) => StoreState[PropertyKey])
  ): void => store.updateProperty(propertyKey, input);

  useEffect(() => {
    const unsubscribe = store.subscribeToStoreChange((newState, prevState) => {
      const newPropertyValue = selectPropertyFn(newState);
      const prevPropertyValue = selectPropertyFn(prevState);
      if (!isEqual(newPropertyValue, prevPropertyValue)) {
        setPropertyValue(newPropertyValue);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return [propertyValue, updateState];
};
