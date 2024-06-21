import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {ROUTE_NAME, STORAGE_KEY} from '../../constant';
import {useGoogleLogin} from '@react-oauth/google';
import {Button} from 'antd';
import {toast} from 'react-toastify';
import {useDispatch} from 'react-redux';
import {getUserLoginInfoApi} from '../../apis';
import {handleErrorResponse} from '../../utils/handleError';
import {localStorageSetItem} from '../../utils/storage';
import {controlLoading} from '../../redux/slices/appSlice';
import {getDataFromToken} from '../../utils/helpers';
import DGVLogo from '../../images/DGVLogo.png';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    getDataFromToken((userData) => {
      navigate(ROUTE_NAME.CHECKIN, {state: {userInfo: userData}});
    });
  }, []);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const {hd, access_token, token_type} = tokenResponse;
      if (hd !== 'dgvdigital.com') {
        return toast.error('Email không hợp lệ', {
          autoClose: 2000,
          position: 'top-center',
        });
      }
      const getUserData = async () => {
        dispatch(controlLoading(true));
        try {
          let param = {
            accessToken: access_token,
            tokenType: token_type,
          };

          const res = await getUserLoginInfoApi(param);

          if (res?.isSuccess) {
            const {accessToken, expiresAccess} = res?.data?.auth;
            const userData = res?.data?.data ? res?.data?.data : null;

            if (!!accessToken && !!expiresAccess) {
              localStorageSetItem(STORAGE_KEY.ACCESS_TOKEN, accessToken);
              localStorageSetItem(STORAGE_KEY.EXPIRES_ACCESS, expiresAccess);
              dispatch(controlLoading(false));
              navigate(ROUTE_NAME.CHECKIN, {state: {userInfo: userData}});
            }
          } else {
            dispatch(controlLoading(false));
            toast.error(res?.detail || 'Đăng nhập thất bại!', {
              autoClose: 2000,
              position: 'top-center',
            });
          }
        } catch (err) {
          console.error('err from HOME', err);
          dispatch(controlLoading(false));
          if (err?.response) {
            handleErrorResponse(err.response);
          } else {
            toast.error(err?.message || 'Đăng nhập thất bại!', {
              autoClose: 2000,
              position: 'top-center',
            });
          }
        }
      };
      getUserData();
    },
    onError: (error) => {
      toast.error(error?.message || 'Đăng nhập thất bại!', {
        autoClose: 2000,
        position: 'top-center',
      });
    },
  });

  const handleLogin = () => {
    login();
  };

  return (
    <div className="relative h-screen bg-gradient-to-b from-[#FF5B7D] to-[#2D9AFF]">
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-white p-10 flex flex-col items-center justify-center gap-10 rounded-xl">
        <div>
          <img className="w-[180px] md:w-[250px] " src={DGVLogo} alt="" />
        </div>
        <div className="font-bold text-2xl text-primary mb-20">WELCOME</div>
        <div className="">
          <Button onClick={handleLogin} className="bg-primary-pink" type="primary">
            Login with Google
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
