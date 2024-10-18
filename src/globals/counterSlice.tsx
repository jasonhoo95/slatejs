import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface CounterState {
  value: number;
  list: any;
  editor: any;
  openCheck: boolean;
  checkTable: boolean;
}

const initialState: CounterState = {
  value: 0,
  list: null,
  editor: null,
  openCheck: false,
  checkTable: false
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state, action: PayloadAction<any>) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.list = JSON.stringify(action.payload.data);
      state.editor = action.payload.editor;
      state.openCheck = action.payload.open;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += 1;
    },
    checkByTable: (state, action: PayloadAction<any>) => {
      state.checkTable = action.payload;

    }
  },
});

// Action creators are generated for each case reducer function
export const { increment, decrement, incrementByAmount, checkByTable } = counterSlice.actions;

export default counterSlice.reducer;
