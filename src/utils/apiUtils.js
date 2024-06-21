import axios from 'axios';
// import {handleErrorMessage} from './handleError';
// import {appHost, appAuth} from '../configs/appConfigs';
import {toast} from 'react-toastify';
import {localStorageGetItem, localStorageSetItem, localStorageRemoveItem} from './storage';
// import store from '../storeRedux/index';
// import {signOutAction} from '../redux/actions/global';
import {STORAGE_KEY} from '../constant';

/*
axios.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const originalConfig = err.config;
    console.log(
      '🚀 ~ file: apiUtils.js ~ line 37 ~ originalConfig',
      JSON.stringify(originalConfig, null, 2)
    );

    if (err.response) {
      // Access Token was expired
      if (err.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;
       
        try {
          if (isRefreshingToken) {
            return;
          }
          isRefreshingToken = true;
          const refreshToken = localStorageGetItem('refreshToken');
          console.log('🚀 ~ file: apiUtils.js ~ line 45 ~ refreshToken', refreshToken);

          const rs = await refreshTokenApi({refreshToken});
          isRefreshingToken = false;
          console.log('🚀 ~ file: apiUtils.js ~ line 45 ~ rs', rs);
          // const {accessToken} = rs.data;
          console.log('🚀 ~ file: apiUtils.js ~ line 53 ~ rs?.accessToken', rs?.access_token);
          console.log('🚀 ~ file: apiUtils.js ~ line 55 ~ rs?.refreshToken', rs?.refresh_token);
          localStorageSetItem('accessToken', rs?.access_token);
          localStorageSetItem('refreshToken', rs?.refresh_token);
          setAuthToken(rs?.access_token);
          // await wait(3000);
          // axios.defaults.headers.common['Authorization'] = `Bearer ${rs?.access_token}`;
          // window.localStorage.setItem('accessToken', accessToken);
          // axios.defaults.headers.common['x-access-token'] = accessToken;
          // return Promise.reject(err);
          originalConfig.headers.Authorization = rs?.access_token;
          window.location.reload(false);
          // return axios(originalConfig);
        } catch (_error) {
          const accessToken = localStorageGetItem('accessToken');
          !!accessToken && handleTokenExpire();

          return Promise.reject(_error);
        }       
      }

      if (err.response.status === 403 && err.response.data) {
        return Promise.reject(err.response.data);
      }
    }

    return Promise.reject(err);
  }
);

export const refreshTokenApi = ({refreshToken}) => {
  const payload = {
    client_id: appAuth.client_id,
    client_secret: appAuth.client_secret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  };

  const data = new URLSearchParams(payload).toString();

  return new Promise((resolve, reject) => {
    axios
      .post(`${appHost.identityHost}connect/token`, data, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .then((response) => {
        const {data} = response;
        resolve(data);
      })
      .catch((err) => reject(handleErrorMessage(err)));
  });
};

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else delete axios.defaults.headers.common['Authorization'];
};

export const handleTokenExpire = () => {
  const dispatch = store?.dispatch;
  if (dispatch) {
    dispatch(signOutAction({showModal: true}));

    toast('Phiên đăng nhập đã hết hạn. Xin hãy đăng nhập lại!', {type: 'info'});
  }
};


*/
// export const setAuthToken = (token) => {
//   if (token) {
//     axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     return token;
//   } else return delete axios.defaults.headers.common['Authorization'];
// };

axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups';

axios.interceptors.request.use(
  (config) => {
    config.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      // 'Access-Control-Allow-Origin': '*',
    };
    const token = localStorageGetItem(STORAGE_KEY.ACCESS_TOKEN);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (res) => {
    const {data} = res;
    return data;
  },
  (error) => {
    console.error('🚀 ~ file: apiUtils.js:207 ~ error:', error);

    if (error?.response?.status === 401) {
      const token = localStorageGetItem(STORAGE_KEY.ACCESS_TOKEN);

      if (!token) {
        return Promise.reject(error);
      } else {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', {
          autoClose: 2000,
          position: 'top-center',
        });
        localStorageRemoveItem(STORAGE_KEY.ACCESS_TOKEN);
        localStorageRemoveItem(STORAGE_KEY.EXPIRES_ACCESS);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export function requestApi({endpoint, method, body, responseType = 'json', params}) {
  // const baseUrl = getApiBaseUrl(serviceName);
  const baseUrl = `${process.env.REACT_APP_END_POINT}`;

  const reqObj = {
    method: method,
    url: `${baseUrl}${endpoint}`,
    data: body,
    responseType: responseType,
  };
  if (params) reqObj.params = params;

  return axios.request(reqObj);
}
