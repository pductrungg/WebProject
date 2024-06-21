import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    controlLoading: (state, {payload}) => {
      state.isLoading = payload;
    },
  },
  extraReducers: (builder) => {
    // builder.addCase(action, (state, action) => {    })
  },
});

const {actions, reducer} = appSlice;

export const {controlLoading} = actions;

export default reducer;
