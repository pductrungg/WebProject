import {createSlice} from '@reduxjs/toolkit';
// import {signOutAction} from '../actions/global';
import {STORAGE_KEY} from '../../constant';
import {localStorageRemoveItem} from '../../utils/storage';

const initialState = {};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signOutAction: () => {
      localStorageRemoveItem(STORAGE_KEY.ACCESS_TOKEN);
      localStorageRemoveItem(STORAGE_KEY.EXPIRES_ACCESS);
    },
  },
  extraReducers: (builder) => {
    // builder.addCase(action, (state, action) => {    })
  },
});

const {actions, reducer} = authSlice;
export const {signOutAction} = actions;

export default reducer;
