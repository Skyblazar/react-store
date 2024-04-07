import { useEffect, useState } from 'react';
import { Immutable, StoreActions } from '../store.types';
import { Store } from '../store';
import { isEqual } from 'lodash';

/**
 * Subscribe to changes in a store property
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
