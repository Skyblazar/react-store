import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Store } from '../../store';
import { useStore } from '../../hooks/useStore';

const actionsStore = new Store(
  'actionsStore',
  {
    firstCount: 0,
    secondCount: 1,
    thirdCount: 2,
  },
  {
    incrementFirstCount: (payload: number, { updateState, state }) => {
      updateState({
        ...state,
        firstCount: ++payload,
      });
    },
    incrementSecondCount: (payload: number, { updateState, state }) => {
      updateState({
        ...state,
        secondCount: ++payload,
      });
    },
    updateThirdCount: (payload: number, { updateState, state }) => {
      updateState({
        ...state,
        thirdCount: payload,
      });
    },
  }
);

const TestComponent: React.FunctionComponent = () => {
  const { firstCount, secondCount, thirdCount } = useStore(actionsStore);

  return (
    <div>
      <button
        data-testid="firstCountBtn"
        onClick={() => actionsStore.dispatch('incrementFirstCount', state => state.firstCount)}
      >
        {firstCount}
      </button>

      <button
        data-testid="secondCountBtn"
        onClick={() => actionsStore.dispatch('incrementSecondCount', state => state.secondCount)}
      >
        {secondCount}
      </button>

      <button
        data-testid="thirdCountBtn"
        onClick={() => actionsStore.dispatch('updateThirdCount', state => state.thirdCount + 100)}
      >
        {thirdCount}
      </button>
    </div>
  );
};

describe('useStore', () => {
  const renderTestComponent = () => render(<TestComponent />);

  describe('actions update:', () => {
    it('should relect state update', async () => {
      renderTestComponent();

      const firstCountBtn = screen.getByTestId('firstCountBtn');
      expect(firstCountBtn).toHaveTextContent('0');

      await userEvent.click(firstCountBtn);
      await waitFor(() => expect(firstCountBtn).toHaveTextContent('1'));

      await userEvent.click(firstCountBtn);
      await waitFor(() => expect(firstCountBtn).toHaveTextContent('2'));

      await userEvent.click(firstCountBtn);
      await waitFor(() => expect(firstCountBtn).toHaveTextContent('3'));
    });
  });
});
