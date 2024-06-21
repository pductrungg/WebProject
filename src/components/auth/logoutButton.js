import {useNavigate} from 'react-router-dom';
import {Button} from 'antd';
import {googleLogout} from '@react-oauth/google';
import {ROUTE_NAME} from '../../constant';
import {useDispatch} from 'react-redux';
import {signOutAction} from '../../redux/slices/authSlice';

const LogoutButton = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleLogout = () => {
    googleLogout();
    dispatch(signOutAction());
    navigate(ROUTE_NAME.HOME, {state: null});
  };

  return <Button onClick={handleLogout}>Logout</Button>;
};

export default LogoutButton;
