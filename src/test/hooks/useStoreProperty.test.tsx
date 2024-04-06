import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Store } from '../../store';
import { useStoreProperty } from '../../hooks/useStoreProperty';

const testStore = new Store(
  'testStore',
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
    incrementAll: (payload: null, { updateState, state }) => {
      updateState({
        ...state,
        firstCount: state.firstCount + 1,
        secondCount: state.secondCount + 1,
        thirdCount: state.thirdCount + 1,
      });
    },
  }
);

const TestComponent: React.FunctionComponent = () => {
  const firstCount = useStoreProperty(testStore, state => state.firstCount);
  const secondCount = useStoreProperty(testStore, state => state.secondCount);

  return (
    <div>
      <button
        data-testid="firstCountBtn"
        onClick={() => testStore.dispatch('incrementFirstCount', state => state.firstCount)}
      >
        {firstCount}
      </button>

      <button
        data-testid="secondCountBtn"
        onClick={() => testStore.dispatch('incrementSecondCount', state => state.secondCount)}
      >
        {secondCount}
      </button>

      <button
        data-testid="thirdCountBtn"
        onClick={() => testStore.dispatch('updateThirdCount', state => state.thirdCount + 100)}
      >
        {testStore.state.thirdCount}
      </button>

      <button data-testid="allBtn" onClick={() => testStore.dispatch('incrementAll', () => null)}>
        All
      </button>
    </div>
  );
};

describe('useStoreProperty', () => {
  const renderTestComponent = () => render(<TestComponent />);

  beforeEach(() => {
    testStore.reset();
  });

  describe('actions update:', () => {
    it('should relect state update for first button', async () => {
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

    it('should relect state update for second button', async () => {
      renderTestComponent();

      const secondCountBtn = screen.getByTestId('secondCountBtn');
      expect(secondCountBtn).toHaveTextContent('1');

      await userEvent.click(secondCountBtn);
      await waitFor(() => expect(secondCountBtn).toHaveTextContent('2'));

      await userEvent.click(secondCountBtn);
      await waitFor(() => expect(secondCountBtn).toHaveTextContent('3'));

      await userEvent.click(secondCountBtn);
      await waitFor(() => expect(secondCountBtn).toHaveTextContent('4'));
    });

    it('should NOT relect state update for third button', async () => {
      renderTestComponent();

      const thirdCountBtn = screen.getByTestId('thirdCountBtn');
      expect(thirdCountBtn).toHaveTextContent('2');

      await userEvent.click(thirdCountBtn);
      expect(thirdCountBtn).toHaveTextContent('2');

      await userEvent.click(thirdCountBtn);
      expect(thirdCountBtn).toHaveTextContent('2');

      await userEvent.click(thirdCountBtn);
      expect(thirdCountBtn).toHaveTextContent('2');
    });

    it('should relect state update for all button', async () => {
      renderTestComponent();

      const allBtn = screen.getByTestId('allBtn');
      const firstCountBtn = screen.getByTestId('firstCountBtn');
      const secondCountBtn = screen.getByTestId('secondCountBtn');
      const thirdCountBtn = screen.getByTestId('thirdCountBtn');
      expect(firstCountBtn).toHaveTextContent('0');
      expect(secondCountBtn).toHaveTextContent('1');
      expect(thirdCountBtn).toHaveTextContent('2');

      await userEvent.click(allBtn);
      await waitFor(() => expect(firstCountBtn).toHaveTextContent('1'));
      await waitFor(() => expect(secondCountBtn).toHaveTextContent('2'));
      await waitFor(() => expect(thirdCountBtn).toHaveTextContent('3'));
    });
  });
});
