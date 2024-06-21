import React from 'react';
import {ROUTE_NAME} from '../constant';
import CheckIn from '../pages/checkin';
import Home from '../pages/home';

const Layout = React.lazy(() => import('../components/common/Layout'));

const routes = [
  {
    path: ROUTE_NAME.HOME,
    element: <Home />,
  },
  {
    path: ROUTE_NAME.CHECKIN,
    element: (
      <Layout>
        <CheckIn />
      </Layout>
    ),
  },
];

export default routes;
