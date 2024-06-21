export const ROUTE_NAME = {
  HOME: '/',
  CHECKIN: '/checkin',
};

export const CODE_KEY = {
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ERROR_NETWORK: 'ERROR_NETWORK',
  TIME_OUT: 408,
  UNAUTHORIZED_STATUS: 401,
  NOT_INTERNET: 'NOT_INTERNET',
  UNDEFINED: 'UNDEFINED',
  UNKNOWN: 'UNKNOWN',
};

export const ERROR_MESSAGE = {
  [CODE_KEY.UNAUTHORIZED_STATUS]: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.',
  // [CODE_KEY.USER_NOT_FOUND]: 'Người dùng không tồn tại.',
  // [CODE_KEY.LOGIN_FAILED]: 'Đăng nhập thất bại, vui lòng kiểm tra lại thông tin đăng nhập.',
  [CODE_KEY.NOT_INTERNET]: 'Không có kết nối internet. Vui lòng kiểm tra đường truyền',
  [CODE_KEY.NOT_FOUND]: 'Không tìm thấy trang.',
};

export const API_METHOD = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

export const DATE_FORMAT = 'DD/MM/YYYY';

export const CHECKIN_STATUS = {
  NORMAL: 0,
  LATE_CHECKIN: 1,
  EARLY_CHECKOUT: 2,
  FORGET_CHECKIN: 3,
  FORGET_CHECKOUT: 4,
  MISSING_TIME: 5,
  ABSENT: 6,
  DAY_OFF: 7,
  LEAVE_OF_ABSENCE: 8,
};

export const CHECKIN_STATUS_TEXT = {
  NORMAL: 'Bình thường',
  LATE_CHECKIN: 'Đi trễ',
  EARLY_CHECKOUT: 'Về sớm',
  FORGET_CHECKIN: 'Quên checkin',
  FORGET_CHECKOUT: 'Quên checkout',
  MISSING_TIME: 'Thiếu giờ',
  ABSENT: 'Nghỉ',
  DAY_OFF: 'Nghỉ cả ngày',
  LEAVE_OF_ABSENCE: 'Nghỉ phép',
};

export const DEPARTMENT_CODE = {
  KETOAN: 'KETOAN',
  TECH: 'TECH',
  BACKOFFICE: 'BACKOFFICE',
  PRODUCT: 'PRODUCT',
  BD: 'BD',
  MKT: 'MKT',
  BGD: 'BGD',
};

export const STORAGE_KEY = {
  ACCESS_TOKEN: 'ACCESS_TOKEN',
  EXPIRES_ACCESS: 'EXPIRES_ACCESS',
};

export const CLAIM_TYPES = {
  EMAIL_ADDRESS: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  NAME: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  NAME_IDENTIFIER: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
};

export const LEAVE_TIME_HOUR = {
  MORNING: 3,
  AFTERNOON: 5,
  A_DAY: 8,
  TWO_DAYS: 16,
  OTHER: -1,
  // SEVERAL_DAYS: -2,
};

export const LEAVE_TIME_OPTIONS = [
  // {
  //   label: 'Buổi sáng',
  //   value: LEAVE_TIME_HOUR.MORNING,
  // },
  // {
  //   label: 'Buổi chiều',
  //   value: LEAVE_TIME_HOUR.AFTERNOON,
  // },
  {
    label: 'Một ngày',
    value: LEAVE_TIME_HOUR.A_DAY,
  },
  {
    label: 'Hai ngày',
    value: LEAVE_TIME_HOUR.TWO_DAYS,
  },
  {
    label: 'Khác',
    value: LEAVE_TIME_HOUR.OTHER,
  },
  // {
  //   label: 'Nhiều ngày',
  //   value: LEAVE_TIME_HOUR.SEVERAL_DAYS,
  // },
];

export const GET_DAY_FUNC_TYPE = {
  START_DAY: 'START_DAY',
  END_DAY: 'END_DAY',
  TO_JSON: 'TO_JSON',
};

export const WORKING_TIME = {
  START: [9, 0, 0],
  END: [18, 0, 0],
  NEW_DAY: [0, 0, 0],
};

export const LEAVE_REQUEST_STATUS = {
  APPROVED: 1,
  REJECTED: 2,
};

export const AMIS_PROCESS_URL = 'https://amisapp.misa.vn/process/execute/4?ID=';
