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

      <button data-testid="allBtn" onClick={() => actionsStore.dispatch('incrementAll', () => null)}>
        All
      </button>
    </div>
  );
};

describe('useStore', () => {
  const renderTestComponent = () => render(<TestComponent />);

  beforeEach(() => {
    actionsStore.reset();
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

    it('should relect state update for third button', async () => {
      renderTestComponent();

      const thirdCountBtn = screen.getByTestId('thirdCountBtn');
      expect(thirdCountBtn).toHaveTextContent('2');

      await userEvent.click(thirdCountBtn);
      await waitFor(() => expect(thirdCountBtn).toHaveTextContent('102'));

      await userEvent.click(thirdCountBtn);
      await waitFor(() => expect(thirdCountBtn).toHaveTextContent('202'));

      await userEvent.click(thirdCountBtn);
      await waitFor(() => expect(thirdCountBtn).toHaveTextContent('302'));
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
