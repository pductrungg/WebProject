import DGVLogo from '../../images/DGVLogo.png';
import {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import LogoutButton from '../auth/logoutButton';
import {getDataFromToken} from '../../utils/helpers';

const Header = () => {
  const {state} = useLocation();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      let userInfo;
      if (!!state?.userInfo) {
        userInfo = state?.userInfo;
      } else {
        userInfo = getDataFromToken();
      }

      if (!!userInfo) {
        setUserName(userInfo?.fullName);
      }
    };

    checkAuth();
  }, []);

  return (
    <>
      <div className="bg-background-blue lg:px-10 px-4">
        <div className="flex justify-between py-4">
          <div>
            <img className="w-[170px]" src={DGVLogo} alt="" />
          </div>
          <div className="flex items-center gap-4">
            {!!userName && (
              <div className="hidden md:block">
                <span>Xin chào, </span>
                <span className="font-bold">{userName}</span>
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
