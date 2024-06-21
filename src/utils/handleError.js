import {CODE_KEY} from '../constant';
import _ from 'lodash';
import {toast} from 'react-toastify';

function convertDataError(error) {
  const {code = {}, message, status, Messages, messages} = error;

  if (message && message.search('Cannot read property') >= 0) {
    return {
      code: CODE_KEY.UNDEFINED,
      message: 'Truy vấn dữ liệu lỗi.',
      status,
    };
  }
  if (message && message.search('Network Error') >= 0) {
    return {
      code: CODE_KEY.ERROR_NETWORK,
      message: 'Không thể kết nối tới server.',
      status,
    };
  }

  if (Array.isArray(messages) && !_.isEmpty(messages)) {
    return {
      code,
      message: messages[0]?.content,
      status,
    };
  }

  if (Array.isArray(Messages) && !_.isEmpty(Messages)) {
    return {
      code,
      message: Messages[0]?.Content,
      status,
    };
  }

  return error;
}

export function handleErrorMessage(err) {
  const {response} = err;
  if (response?.data) {
    return convertDataError(response.data);
  }
  return convertDataError(err);
}

export function handleErrorResponse(error, callback) {
  if (error?.status === 401)
    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', {
      autoClose: 2000,
      position: 'top-center',
    });
  if (error?.data?.message)
    toast.error(error.data.message, {autoClose: 2000, position: 'top-center'});
  else if (error?.data?.messages) {
    error.data.messages.forEach((element) => {
      if (element.content) toast.error(element.content, {autoClose: 2000, position: 'top-center'});
      else toast.error(element, {autoClose: 2000, position: 'top-center'});
    });
  } else if (error?.data?.detail) {
    toast.error(error.data.detail, {autoClose: 2000, position: 'top-center'});
  } else if (error?.data?.errors) {
    toast.error(error.data.errors.title, {autoClose: 2000, position: 'top-center'});
  } else toast.error(error, {autoClose: 2000, position: 'top-center'});

  if (callback) callback();

  console.error('error from handleErrorResponse', error);
}
