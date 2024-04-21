# react-store

**NOTE: Do not use in production for now (Check back in one week)**

Global state management for react

## Installation

```bash
npm i @skyblazar/react-store --save
```

## Usage

### Create a new Store

#### Simple store

```typescript
import { Store } from 'react-store';

export const myStore = new Store('myStore', { myProperty: 0, myOtherProperty: 'value' });
```

Update the store from anywhere. All connected components (See [Hooks](#connect-react-components-with-hooks)) will be re-rendered and all subscribed callbacks will be called

```typescript
import { myStore } from 'stores/myStore.store';

// Update the store state
myStore.updateState({ myProperty: 2 });

// Use the current store state to derive a new store state
myStore.updateState(state => ({ ...state, myProperty: 2 }));

// Update a store property value
myStore.updateProperty('myProperty', -100);

// Use the current store state to derive a new property value
myStore.updateProperty('myProperty', state => state.myProperty - 10);
```

#### Store with actions

```typescript
import { Store } from 'react-store';

export const myStore = new Store(
  'myStore',
  { myProperty: 0, myOtherProperty: 'value' },
  {
    INCREMENT_MY_PROPERTY: ({ updateState, state }) => {
      updateState({
        ...state,
        myProperty: state.myProperty + 1,
      });
    },
    SET_MY_PROPERTY: ({ updateState, state }, payload: number) => {
      updateState({
        ...state,
        myProperty: payload,
      });
    },
    SET_MY_PROPERTY_2: ({ updateProperty, state }, payload: number) => {
      updateProperty('myProperty', payload);
    },
  }
);

// Dispatch action without payload
myStore.dispatch('INCREMENT_MY_PROPERTY');

// Dispatch action with payload derived from current store state
myStore.dispatch('SET_MY_PROPERTY', state => state.myProperty * 100);

// Dispatch action with payload derived from current store state
myStore.dispatch('SET_MY_PROPERTY_2', state => state.myProperty / 100);
```

### Connect React components with store hooks

```typescript
import { Store } from 'react-store';

export const myStore = new Store('myStore', { myProperty1: 0, myProperty2: 0 });
```

```jsx
import React from 'react';
import { useStore, useStoreProperty } from 'react-stores';
import { myStore } from 'stores/myStore.store';

export const MyComponent: React.FC = () => {
  // This will trigger a component re-render whenever anything changes in the store state
  const [myStoreState, setMyStoreState] = useStore(myStore);
  // This will trigger a component re-render whenever "myProperty2" changes
  const [myProperty2, setMyProperty2] = useStoreProperty(myStore, state => state.myProperty2, 'myProperty2');

  return (
    <>
      <div onClick={() => setMyStoreState(state => ({...state, myProperty1: state.myProperty1 + 1}))}>
        Increment 1: {myStoreState.myProperty1}
      <div/>

      <div onClick={() => setMyProperty2(state => state.myProperty2 + 1)}>
        Increment 2: {myStoreState.myProperty2}
      <div/>
    </>
  );
}
```
