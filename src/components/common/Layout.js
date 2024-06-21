import Header from './Header';
import {useSelector} from 'react-redux';
import {controlLoadingSelector} from '../../redux/selectors';
import {Spin} from 'antd';

const Layout = ({children}) => {
  const isLoading = useSelector(controlLoadingSelector);

  return (
    <>
      <Header />
      <main className="relative">
        <div
          className={`${
            isLoading ? 'block' : 'hidden'
          } controlLoading absolute bg-[#fefeffe6] inset-0 z-30`}
        >
          <div className={'flex justify-center items-center w-full  fixed top-1/2'}>
            <Spin size="large" />
          </div>
        </div>
        {children}
      </main>
    </>
  );
};

export default Layout;
