import {
  CHECKIN_STATUS,
  DEPARTMENT_CODE,
  STORAGE_KEY,
  CLAIM_TYPES,
  LEAVE_TIME_HOUR,
  GET_DAY_FUNC_TYPE,
  LEAVE_REQUEST_STATUS,
  AMIS_PROCESS_URL,
} from '../constant';
import jwt_decode from 'jwt-decode';
import {localStorageGetItem} from './storage';
import {toast} from 'react-toastify';
import dayjs from 'dayjs';

export const getStatusCheckinText = (statusNum) => {
  let text = '';
  switch (statusNum) {
    case CHECKIN_STATUS.NORMAL:
      text = 'bình thường';
      break;
    case CHECKIN_STATUS.LATE_CHECKIN:
      text = 'đi trễ';
      break;
    case CHECKIN_STATUS.EARLY_CHECKOUT:
      text = 'về sớm';
      break;
    case CHECKIN_STATUS.FORGET_CHECKIN:
      text = 'quên checkin';
      break;
    case CHECKIN_STATUS.FORGET_CHECKOUT:
      text = 'quên checkout';
      break;
    case CHECKIN_STATUS.MISSING_TIME:
      text = 'thiếu giờ';
      break;
    case CHECKIN_STATUS.ABSENT:
      text = 'nghỉ';
      break;
    case CHECKIN_STATUS.DAY_OFF:
      text = 'nghỉ cả ngày';
      break;
    case CHECKIN_STATUS.LEAVE_OF_ABSENCE:
      text = 'nghỉ phép';
      break;
    default:
      break;
  }
  return text;
};

export const getStatusCheckinColor = (statusNum) => {
  let color = '';
  switch (statusNum) {
    case CHECKIN_STATUS.NORMAL:
    case CHECKIN_STATUS.LEAVE_OF_ABSENCE:
      color = 'green';
      break;
    case CHECKIN_STATUS.LATE_CHECKIN:
    case CHECKIN_STATUS.EARLY_CHECKOUT:
    case CHECKIN_STATUS.FORGET_CHECKIN:
    case CHECKIN_STATUS.FORGET_CHECKOUT:
      color = 'red';
      break;
    case CHECKIN_STATUS.MISSING_TIME:
      color = 'yellow';
      break;
    case CHECKIN_STATUS.ABSENT:
    case CHECKIN_STATUS.DAY_OFF:
      color = 'blue';
      break;
    default:
      break;
  }
  return color;
};

export const getDepartmentContent = (code) => {
  let text = '';
  switch (code) {
    case DEPARTMENT_CODE.KETOAN:
      text = 'Phòng Kế toán';
      break;
    case DEPARTMENT_CODE.TECH:
      text = 'Phòng Tech';
      break;
    case DEPARTMENT_CODE.BACKOFFICE:
      text = 'Phòng Hành chính nhân sự';
      break;
    case DEPARTMENT_CODE.PRODUCT:
      text = 'Phòng Product';
      break;
    case DEPARTMENT_CODE.BD:
      text = 'Phòng Kinh doanh';
      break;
    case DEPARTMENT_CODE.MKT:
      text = 'Phòng Marketing';
      break;
    case DEPARTMENT_CODE.BGD:
      text = 'Ban giám đốc';
      break;
    default:
      break;
  }

  return text;
};

export const getDataFromToken = (callback = null, reject = null) => {
  const accessToken = localStorageGetItem(STORAGE_KEY.ACCESS_TOKEN);
  const expiresAccess = localStorageGetItem(STORAGE_KEY.EXPIRES_ACCESS);

  if (!accessToken || !expiresAccess) {
    if (!!reject) return reject();
    return;
  }

  if (new Date(expiresAccess) > new Date()) {
    const data = jwt_decode(accessToken);
    const userData = {
      userId: Number(data[CLAIM_TYPES.NAME_IDENTIFIER]),
      fullName: data[CLAIM_TYPES.NAME],
      email: data[CLAIM_TYPES.EMAIL_ADDRESS],
      deptId: Number(data.DeptId),
    };

    if (callback !== null) return callback(userData);

    return userData;
  }
  toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', {
    autoClose: 2000,
    position: 'top-center',
  });
};

export const getDayToCalcTime = (type, date) => {
  switch (type) {
    case GET_DAY_FUNC_TYPE.START_DAY:
      return dayjs(date).set('h', 9).set('m', 0);

    case GET_DAY_FUNC_TYPE.END_DAY:
      return dayjs(date).set('h', 18).set('m', 0);

    case GET_DAY_FUNC_TYPE.TO_JSON:
      return date.toJSON().slice(0, 10);

    default:
      break;
  }
};

export const calcLeaveHours = (start, end) => {
  let leaveHours;
  let temp = Number((end.diff(start, 'minute') / 60).toFixed(1));
  let noon = dayjs(start).set('h', 12).set('m', 0);

  // temp: >= 8
  if (temp >= LEAVE_TIME_HOUR.A_DAY) {
    leaveHours = LEAVE_TIME_HOUR.A_DAY;
  }

  // temp: >= 6 && < 8
  else if (temp >= LEAVE_TIME_HOUR.AFTERNOON + 1 && temp < LEAVE_TIME_HOUR.A_DAY) {
    leaveHours = temp - 1;
  }

  // temp: >=5  && < 6
  else if (temp >= LEAVE_TIME_HOUR.AFTERNOON && temp < LEAVE_TIME_HOUR.AFTERNOON + 1) {
    if (start <= noon) leaveHours = temp - 1;
    else leaveHours = LEAVE_TIME_HOUR.AFTERNOON;
  }

  // temp: >=4 && <5
  else if (temp >= LEAVE_TIME_HOUR.MORNING + 1 && temp < LEAVE_TIME_HOUR.AFTERNOON) {
    if (start <= noon) leaveHours = temp - 1;
    else leaveHours = temp;
  }

  // temp: >=3 && <4
  else if (temp >= LEAVE_TIME_HOUR.MORNING && temp < LEAVE_TIME_HOUR.MORNING + 1) {
    if (start <= noon) leaveHours = LEAVE_TIME_HOUR.MORNING;
    else leaveHours = temp;
  }

  // temp: <3
  else leaveHours = temp;

  return leaveHours;
};

export const checkWeekend = (date) => {
  let checkWeekend = date.day(); // 0-Sunday   6-Saturday
  return checkWeekend === 0 || checkWeekend === 6;
};

export const getStatusLeaveRequestText = (statusNum) => {
  let text = '';
  switch (statusNum) {
    case LEAVE_REQUEST_STATUS.APPROVED:
      text = 'Đã duyệt';
      break;
    case LEAVE_REQUEST_STATUS.REJECTED:
      text = 'Bị từ chối';
      break;
    default:
      break;
  }
  return text;
};

export const openAmisLeaveOfAbsence = (processExecutionID) => {
  let url = AMIS_PROCESS_URL + processExecutionID;
  window.open(url, '_blank', 'noreferrer');
};
