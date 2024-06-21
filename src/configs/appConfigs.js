/* eslint-disable no-undef */

const END_POINT_CMS = `cms/api`;
const END_POINT_MASTER_DATA = `masterdata/api`;
const END_POINT_GAME = `game/api`;
const END_POINT_AUTH = `auth/enduser/api`;
const END_POINT_ADS = `ads/api`;
const END_POINT_TRANSACTION = `transaction/api`;
const END_POINT_CRM = `crm/api`;
const END_POINT_SEARCH = `search/api`;
const END_POINT_THIRD_PARTY = `third-party/api`;

const AppConfigs = {
  host: {
    apiHost: process.env.REACT_APP_END_POINT,
    identityHost: process.env.REACT_APP_IDENTITY_SERVER,
  },
  endpoint: {
    END_POINT_CMS,
    END_POINT_MASTER_DATA,
    END_POINT_GAME,
    END_POINT_AUTH,
    END_POINT_ADS,
    END_POINT_TRANSACTION,
    END_POINT_CRM,
    END_POINT_SEARCH,
    END_POINT_THIRD_PARTY,
  },
  auth: {
    client_id: process.env.REACT_APP_AUTH_CLIENT_ID,
    client_secret: process.env.REACT_APP_AUTH_CLIENT_SECRET,
    Authorization: process.env.REACT_APP_AUTH_AUTHORIZATION,
    site_key: process.env.REACT_APP_AUTH_SITE_KEY,
  },
  environment: process.env.REACT_APP_ENVIRONMENT,
};

export const appHost = AppConfigs.host;

export const appEndPoint = AppConfigs.endpoint;

export const appAuth = AppConfigs.auth;

export const appEnvironment = AppConfigs.environment;
