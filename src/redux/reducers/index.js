import {combineReducers} from 'redux';
import auth from '../slices/authSlice';
import app from '../slices/appSlice';

const rootReducer = combineReducers({
  auth,
  app,
});
export default rootReducer;
