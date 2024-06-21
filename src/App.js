import React from 'react';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/styles.scss';
import routes from './routes/routes';
import store from './storeRedux/index';
import {Provider} from 'react-redux';
import PageNotFound from './pages/errorPage/PageNotFound';
import {ConfigProvider} from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import utc from 'dayjs/plugin/utc';
import {themeCustom} from './styles/customAntD';
import {ToastContainer} from 'react-toastify';
import {GoogleOAuthProvider} from '@react-oauth/google';

dayjs.locale('vi');
dayjs.extend(utc);

const router = createBrowserRouter([
  {
    path: '*',
    element: <PageNotFound />,
  },
  ...routes,
]);

function App() {
  return (
    <GoogleOAuthProvider clientId={`${process.env.REACT_APP_GOOGLE_CLIENT_ID}`}>
      <ConfigProvider locale={viVN} theme={themeCustom}>
        <Provider store={store}>
          <RouterProvider router={router} />
          <ToastContainer />
        </Provider>
      </ConfigProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
