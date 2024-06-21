import {USER_CHECKIN, AUTH, LEAVE_OF_ABSENCE} from './api-definitions';
import {requestApi} from '../utils/apiUtils';
import {API_METHOD} from '../constant';

export const getUserByNameApi = (params) => {
  return requestApi({
    endpoint: USER_CHECKIN.getUserByNameUrl,
    method: API_METHOD.POST,
    body: params,
  });
};

export const getUserAttendanceReportApi = (params) => {
  return requestApi({
    endpoint: USER_CHECKIN.getUserAttendanceReportUrl,
    method: API_METHOD.POST,
    body: params,
  });
};

export const getUserAttendanceInfoApi = (params) => {
  return requestApi({
    endpoint: USER_CHECKIN.getUserAttendanceInfoUrl,
    method: API_METHOD.POST,
    body: params,
  });
};

export const getUserAttendanceDetailApi = (params) => {
  return requestApi({
    endpoint: USER_CHECKIN.getUserAttendanceDetailUrl,
    method: API_METHOD.POST,
    body: params,
  });
};

export const getUserAttendanceLastWeekApi = (id) => {
  return requestApi({
    endpoint: USER_CHECKIN.getUserAttendanceLastWeekUrl,
    method: API_METHOD.GET,
    params: {userId: id},
  });
};

export const getDepartmentInfoApi = () => {
  return requestApi({
    endpoint: USER_CHECKIN.getDepartmentInfoUrl,
    method: API_METHOD.GET,
  });
};

export const getUserLoginInfoApi = (params) => {
  return requestApi({
    endpoint: AUTH.getUserLoginInfoUrl,
    method: API_METHOD.POST,
    body: params,
  });
};

export const postLeaveOfAbsenceRequestApi = (params) => {
  return requestApi({
    endpoint: LEAVE_OF_ABSENCE.postLeaveOfAbsenceRequestUrl,
    method: API_METHOD.POST,
    body: params,
  });
};

export const getUserLeaveOfAbsenceApi = (params) => {
  return requestApi({
    endpoint: LEAVE_OF_ABSENCE.getUserLeaveOfAbsenceUrl,
    method: API_METHOD.POST,
    body: params,
  });
};

export const updateStatusLeaveOfAbsenceApi = (params) => {
  return requestApi({
    endpoint: LEAVE_OF_ABSENCE.updateStatusLeaveOfAbsenceUrl,
    method: API_METHOD.POST,
    body: params,
  });
};
