import {useState, useEffect, useMemo, useRef, useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {Select, Button, Table, Tag, Checkbox, Spin, Modal} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {DatePicker} from 'antd';
import dayjs from 'dayjs';
import {
  CHECKIN_STATUS,
  DATE_FORMAT,
  CHECKIN_STATUS_TEXT,
  ROUTE_NAME,
  LEAVE_REQUEST_STATUS,
} from '../../constant';
import {
  getStatusCheckinText,
  getStatusCheckinColor,
  getDepartmentContent,
  getDataFromToken,
  getStatusLeaveRequestText,
  openAmisLeaveOfAbsence,
} from '../../utils/helpers';
import {SimpleCardItem} from '../../components/checkin/card';
import {controlLoading} from '../../redux/slices/appSlice';
import {
  getUserByNameApi,
  getUserAttendanceReportApi,
  getUserAttendanceInfoApi,
  getUserAttendanceDetailApi,
  getUserAttendanceLastWeekApi,
  getDepartmentInfoApi,
  postLeaveOfAbsenceRequestApi,
  getUserLeaveOfAbsenceApi,
  updateStatusLeaveOfAbsenceApi,
} from '../../apis';
import debounce from 'lodash/debounce';
import {handleErrorResponse} from '../../utils/handleError';
import {toast} from 'react-toastify';
import {useLocation, useNavigate} from 'react-router-dom';
import LeaveRequestForm from '../../components/leaveRequest/leaveRequestModal';
import CF from '../../components/CustomerForm/CF';

const {RangePicker} = DatePicker;
const CheckboxGroup = Checkbox.Group;

const CheckIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {state} = useLocation();

  // control data
  const [userOptions, setUserOptions] = useState([]);
  const [dataCheckinInfo, setDataCheckinInfo] = useState([]);
  const [dataCheckinFirst, setDataCheckinFirst] = useState([]);
  const [dataCheckinSecond, setDataCheckinSecond] = useState([]);
  const [dataCheckinLastWeek, setDataCheckinLastWeek] = useState([]);
  const [overviewData, setOverviewData] = useState({
    totalLateCheckInDays: 0,
    totalEarlyCheckOutDays: 0,
    totalForgetCheckinDays: 0,
    totalForgetCheckoutDays: 0,
    totalMissingTime: 0,
  });
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentId, setDepartmentId] = useState(null);

  // control input
  const [userId, setUserId] = useState(null);
  const [dates, setDates] = useState(null);
  const [datevalue, setDateValue] = useState([
    dayjs().weekday(-7),
    dayjs().weekday(-7).add(6, 'day'),
  ]);
  const [error, setError] = useState({});
  const [checkedList, setCheckedList] = useState([]);
  const [checkAll, setCheckAll] = useState(true);

  const statusOptions = useMemo(() => {
    return [
      {
        label: CHECKIN_STATUS_TEXT.NORMAL,
        value: CHECKIN_STATUS.NORMAL,
      },
      {
        label: CHECKIN_STATUS_TEXT.LATE_CHECKIN,
        value: CHECKIN_STATUS.LATE_CHECKIN,
      },
      {
        label: CHECKIN_STATUS_TEXT.EARLY_CHECKOUT,
        value: CHECKIN_STATUS.EARLY_CHECKOUT,
      },
      {
        label: CHECKIN_STATUS_TEXT.FORGET_CHECKIN,
        value: CHECKIN_STATUS.FORGET_CHECKIN,
      },
      {
        label: CHECKIN_STATUS_TEXT.FORGET_CHECKOUT,
        value: CHECKIN_STATUS.FORGET_CHECKOUT,
      },
      {
        label: CHECKIN_STATUS_TEXT.MISSING_TIME,
        value: CHECKIN_STATUS.MISSING_TIME,
      },
      {
        label: CHECKIN_STATUS_TEXT.ABSENT,
        value: CHECKIN_STATUS.ABSENT,
      },
      {
        label: CHECKIN_STATUS_TEXT.DAY_OFF,
        value: CHECKIN_STATUS.DAY_OFF,
      },
      {
        label: CHECKIN_STATUS_TEXT.LEAVE_OF_ABSENCE,
        value: CHECKIN_STATUS.LEAVE_OF_ABSENCE,
      },
    ];
  }, []);

  // control async select
  const debounceTimeout = useMemo(() => 800, []);
  const [fetching, setFetching] = useState(false);
  const fetchRef = useRef(0);

  // control data leave request
  const [dataLeaveRequest, setDataLeaveRequest] = useState([]);

  // control leave request modal
  const [open, setOpen] = useState(false);
  const [submitFormLoading, setSubmitFormLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [currentLQ, setCurrentLQ] = useState(null);
  const [statusCurrentLQ, setStatusCurrentLQ] = useState(null);
  const [isOpenConfirmLQModal, setIsOpenConfirmLQModal] = useState(false);

  const resetStateAfterCloseModal = useCallback(() => {
    setIsOpenConfirmLQModal(false);
    setCurrentLQ(null);
    setStatusCurrentLQ(null);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      let info;
      if (!!state?.userInfo) {
        info = state?.userInfo;
      } else {
        info = getDataFromToken(null, () => {
          toast.error('Vui lòng đăng nhập lại!', {
            autoClose: 2000,
            position: 'top-center',
          });
          navigate(ROUTE_NAME.HOME, {state: null});
        });
      }

      if (!!info) {
        getDepartmentData();
        getUserData(info);

        setCheckedList(Object.values(CHECKIN_STATUS));
        setUserInfo(info);
      }
    };

    const getDepartmentData = async () => {
      dispatch(controlLoading(true));
      try {
        const resDepartment = await getDepartmentInfoApi();

        if (resDepartment?.isSuccess) {
          if (resDepartment?.data.length > 0) {
            let data = resDepartment.data.map((item) => {
              return {
                label: item?.description || getDepartmentContent(item?.deptCode),
                value: item.id,
              };
            });
            setDepartmentOptions(data);
          }
        } else {
          toast.error(resDepartment?.detail || 'Lấy thông tin phòng ban thất bại!', {
            autoClose: 2000,
            position: 'top-center',
          });
          setDepartmentOptions([]);
        }
        dispatch(controlLoading(false));
      } catch (err) {
        dispatch(controlLoading(false));
        if (err?.response) {
          if (err?.response?.status === 401) {
            navigate(ROUTE_NAME.HOME, {state: null});
          }
          handleErrorResponse(err.response);
        } else {
          toast.error(err?.message || 'Lấy thông tin phòng ban thất bại!', {
            autoClose: 2000,
            position: 'top-center',
          });
        }
      }
    };

    const getUserData = async (userInfo) => {
      const {deptId, userId} = userInfo;

      if (!!userId && !!deptId) {
        fetchOptions('', deptId).then((newOptions) => {
          setUserOptions(newOptions);
        });

        setDepartmentId(deptId);
        setUserId(userId);
        const params = generateParams(userId);
        getData(params);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const filterData = () => {
      let data = dataCheckinInfo?.filter((item) => {
        return item?.statuses.some((status) => checkedList.includes(status));
      });

      setDataCheckinFirst(data);
    };

    filterData();
  }, [checkedList, dataCheckinInfo]);

  const validate = () => {
    let isValid = true;
    let err = {...error};

    if (departmentId === '' || departmentId === undefined || departmentId === null) {
      isValid = false;
      err.department = 'Vui lòng chọn Phòng ban';
    } else {
      err.department = '';
    }

    if (userId === '' || userId === undefined || userId === null) {
      isValid = false;
      err.user = 'Vui lòng chọn Họ tên';
    } else {
      err.user = '';
    }

    if (datevalue === null) {
      isValid = false;
      err.dateRange = 'Vui lòng chọn khoảng thời gian';
    } else {
      err.dateRange = '';
    }

    setError(err);

    return isValid;
  };

  const fetchOptions = useCallback(async (value, departmentId) => {
    let params = {
      departmentId: departmentId,
      name: value,
    };

    try {
      const response = await getUserByNameApi(params);

      if (response?.isSuccess) {
        return response?.data?.map((user) => {
          return {
            label: user.fullName,
            value: user.userId,
          };
        });
      }
    } catch (err) {
      if (err?.response) {
        handleErrorResponse(err.response);
      } else {
        toast.error(err?.message || 'Lấy thông tin người dùng thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
      }
    }
  }, []);

  const handleSearchUser = useMemo(() => {
    const loadOptions = (value) => {
      if (!departmentId) {
        let err = {...error};
        err.department = 'Vui lòng chọn Phòng ban';
        setError(err);
        return;
      } else if (error?.department) {
        setError({...error, department: ''});
      }

      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setUserOptions([]);
      setFetching(true);
      fetchOptions(value, departmentId).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return;
        }
        setUserOptions(newOptions);
        setFetching(false);
      });
    };
    return debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout, departmentId, error]);

  const handleChangeUserSelect = (value) => {
    setUserId(value);
  };
  const handleChangeDepartmentSelect = (value) => {
    setDepartmentId(value);
    setUserId(null);

    setUserOptions([]);
    setFetching(true);
    fetchOptions('', value).then((newOptions) => {
      setUserOptions(newOptions);
    });
    setFetching(false);
  };

  const generateParams = (id) => {
    return {
      userId: id,
      fromDate: datevalue?.[0]?.format('YYYY-MM-DD 00:00:00'),
      toDate: datevalue?.[1]?.format('YYYY-MM-DD 23:59:59'),
    };
  };

  const handleSearch = (id) => {
    const params = generateParams(id);

    let isValid = validate();
    if (isValid) {
      getData(params);
    }
  };

  const getDataUserAttendanceReport = useCallback(async (data) => {
    // get data of getUserAttendanceReportApi
    try {
      const resReport = await getUserAttendanceReportApi(data);
      if (resReport?.isSuccess) {
        setOverviewData(resReport.data);
      } else {
        toast.error(resReport?.detail || 'Lấy thông tin báo cáo chấm công thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });

        setOverviewData({
          totalLateCheckInDays: 0,
          totalEarlyCheckOutDays: 0,
          totalForgetCheckinDays: 0,
          totalForgetCheckoutDays: 0,
          totalMissingTime: 0,
        });
      }
    } catch (err) {
      if (err?.response) {
        handleErrorResponse(err.response);
      } else {
        toast.error(err?.message || 'Lấy thông tin báo cáo chấm công thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
      }
      setOverviewData({
        totalLateCheckInDays: 0,
        totalEarlyCheckOutDays: 0,
        totalForgetCheckinDays: 0,
        totalForgetCheckoutDays: 0,
        totalMissingTime: 0,
      });
    }
  }, []);

  const getDataUserAttendanceInfo = useCallback(async (data) => {
    // get data of getUserAttendanceInfoApi
    try {
      const resInfo = await getUserAttendanceInfoApi(data);
      if (resInfo?.isSuccess) {
        if (resInfo?.data.length > 0) {
          let data = resInfo.data.map((item, index) => {
            return {
              date: dayjs(item.date).format('DD/MM/YYYY'),
              checkIn: dayjs(item.checkIn).format('HH:mm'),
              checkOut: dayjs(item.checkOut).format('HH:mm'),
              statuses: item.statuses,
              key: index,
            };
          });
          setDataCheckinInfo(data);
          setDataCheckinFirst(data);

          if (!checkAll) {
            setCheckedList(Object.values(CHECKIN_STATUS));
            setCheckAll(true);
          }
        } else {
          setDataCheckinInfo([]);
          setDataCheckinFirst([]);
        }
      } else {
        toast.error(resInfo?.detail || 'Lấy thông tin chấm công thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
        setDataCheckinInfo([]);
        setDataCheckinFirst([]);
      }
    } catch (err) {
      if (err?.response) {
        handleErrorResponse(err.response);
      } else {
        toast.error(err?.message || 'Lấy thông tin chấm công thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
      }
      setDataCheckinInfo([]);
      setDataCheckinFirst([]);
    }
  }, []);

  const getDataUserAttendanceDetail = useCallback(async (data) => {
    // get data of getUserAttendanceDetailApi
    try {
      const resDetail = await getUserAttendanceDetailApi(data);
      if (resDetail?.isSuccess) {
        if (resDetail?.data.length > 0) {
          let data = resDetail.data.map((item, index) => {
            return {
              ...item,
              date: dayjs(item.date).format('DD/MM/YYYY'),
              checkIn: dayjs(item.checkIn).format('HH:mm'),
              checkOut: dayjs(item.checkOut).format('HH:mm'),
              key: index,
            };
          });
          setDataCheckinSecond(data);
        } else {
          setDataCheckinSecond([]);
        }
      } else {
        toast.error(resDetail?.detail || 'Lấy thông tin chi tiết chấm công thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
        setDataCheckinSecond([]);
      }
    } catch (err) {
      if (err?.response) {
        handleErrorResponse(err.response);
      } else {
        toast.error(err?.message || 'Lấy thông tin chi tiết chấm công thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
      }
      setDataCheckinSecond([]);
    }
  }, []);

  const getDataAttendanceLastWeek = useCallback(async (data) => {
    // get data of getUserAttendanceLastWeekApi
    try {
      const resLastWeek = await getUserAttendanceLastWeekApi(data.userId);
      if (resLastWeek?.isSuccess) {
        if (resLastWeek?.data.length > 0) {
          let data = resLastWeek.data.map((item, index) => {
            return {
              ...item,
              key: index,
              date: dayjs(item.date).format('DD/MM/YYYY'),
              checkIn:
                item.checkIn.length > 19
                  ? dayjs(item.checkIn).utcOffset(item.checkIn.slice(-6)).format('HH:mm')
                  : dayjs(item.checkIn).format('HH:mm'),
              checkOut:
                item.checkOut.length > 19
                  ? dayjs(item.checkOut).utcOffset(item.checkOut.slice(-6)).format('HH:mm')
                  : dayjs(item.checkOut).format('HH:mm'),
            };
          });
          setDataCheckinLastWeek(data);
        } else {
          setDataCheckinLastWeek([]);
        }
      } else {
        toast.error(resLastWeek?.detail || 'Lấy thông tin chấm công tuần trước thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
        setDataCheckinLastWeek([]);
      }
    } catch (err) {
      if (err?.response) {
        handleErrorResponse(err.response);
      } else {
        toast.error(err?.message || 'Lấy thông tin chấm công tuần trước thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
      }
      setDataCheckinLastWeek([]);
    }
  }, []);

  const getDataLeaveAbsence = useCallback(async (data) => {
    // get data of getUserLeaveOfAbsenceApi
    try {
      const resLeaveAbsence = await getUserLeaveOfAbsenceApi(data);
      if (resLeaveAbsence?.isSuccess) {
        if (resLeaveAbsence?.data.length > 0) {
          let data = resLeaveAbsence.data.map((item, index) => {
            return {
              ...item,
              key: index,
            };
          });
          setDataLeaveRequest(data);
        } else {
          setDataLeaveRequest([]);
        }
      } else {
        toast.error(resLeaveAbsence?.detail || 'Lấy thông tin nghỉ phép thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
        setDataLeaveRequest([]);
      }
    } catch (err) {
      if (err?.response) {
        handleErrorResponse(err.response);
      } else {
        toast.error(err?.message || 'Lấy thông tin nghỉ phép thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
      }
      setDataLeaveRequest([]);
    }
  }, []);

  const getData = useCallback(async (data) => {
    dispatch(controlLoading(true));

    await Promise.all([
      getDataUserAttendanceReport(data),
      getDataUserAttendanceInfo(data),
      getDataUserAttendanceDetail(data),
      getDataAttendanceLastWeek(data),
      getDataLeaveAbsence(data),
    ]);

    dispatch(controlLoading(false));
  }, []);

  const disabledDate = (current) => {
    if (!dates) {
      return false;
    }
    const tooLate = dates[0] && current.diff(dates[0], 'months') >= 1;
    const tooEarly = dates[1] && dates[1].diff(current, 'months') >= 1;
    return !!tooEarly || !!tooLate;
  };
  const onOpenChange = (open) => {
    if (open) {
      setDates([null, null]);
    } else {
      setDates(null);
    }
  };

  const columnFirst = [
    {
      title: 'Ngày',
      key: 'dateInfo',
      dataIndex: 'date',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Checkin',
      key: 'checkInInfo',
      dataIndex: 'checkIn',
      render: (checkIn) => <>{checkIn !== '00:00' ? checkIn : '-'}</>,
    },
    {
      title: 'Checkout',
      key: 'checkOutInfo',
      dataIndex: 'checkOut',
      render: (checkOut) => <>{checkOut !== '00:00' ? checkOut : '-'}</>,
    },
    {
      title: 'Trạng thái',
      key: 'statusesInfo',
      dataIndex: 'statuses',
      render: (_, {statuses}) => (
        <>
          {statuses?.map((item, index) => {
            return (
              <Tag color={getStatusCheckinColor(item)} key={index}>
                {getStatusCheckinText(item)}
              </Tag>
            );
          })}
        </>
      ),
    },
  ];

  const columnSecond = [
    {
      title: 'Ngày',
      key: 'dateDetail',
      dataIndex: 'date',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Checkin',
      key: 'checkInDetail',
      dataIndex: 'checkIn',
      render: (checkIn) => <>{checkIn !== '00:00' ? checkIn : '-'}</>,
    },
    {
      title: 'Checkout',
      key: 'checkOutDetail',
      dataIndex: 'checkOut',
      render: (checkOut) => <>{checkOut !== '00:00' ? checkOut : '-'}</>,
    },
    {
      title: 'Đi trễ (phút)',
      key: 'lateCheckInDetail',
      dataIndex: 'lateCheckIn',
      render: (lateCheckIn) => <>{lateCheckIn !== 0 ? lateCheckIn : '-'}</>,
    },
    {
      title: 'Về sớm (phút)',
      key: 'earlyCheckOutDetail',
      dataIndex: 'earlyCheckOut',
      render: (earlyCheckOut) => <>{earlyCheckOut !== 0 ? earlyCheckOut : '-'}</>,
    },
    {
      title: 'Làm thiếu giờ (giờ)',
      key: 'missingTimeDetail',
      dataIndex: 'missingTime',
      render: (missingTime) => <>{missingTime !== 0 ? missingTime : '-'}</>,
    },
    {
      title: 'Nghỉ (giờ)',
      key: 'absentDetail',
      dataIndex: 'absent',
      render: (absent) => <>{absent !== 0 ? absent : '-'}</>,
    },
  ];

  const columnWeekly = [
    {
      title: 'Ngày',
      key: 'dateLastweek',
      dataIndex: 'date',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Checkin',
      key: 'checkInLastweek',
      dataIndex: 'checkIn',
      render: (checkIn) => <>{checkIn !== '00:00' ? checkIn : '-'}</>,
    },
    {
      title: 'Checkout',
      key: 'checkOutLastweek',
      dataIndex: 'checkOut',
      render: (checkOut) => <>{checkOut !== '00:00' ? checkOut : '-'}</>,
    },
    {
      title: 'Tổng số giờ làm',
      key: 'totalWorkTimeLastweek',
      dataIndex: 'totalWorkTime',
      render: (totalWorkTime) => <>{totalWorkTime !== 0 ? totalWorkTime : '-'}</>,
    },
  ];

  const columnLeaveRequest = [
    {
      title: 'Nghỉ từ',
      key: 'leaveFrom_LeaveRequest',
      dataIndex: 'leaveFrom',
      className: 'min-w-[80px]',
      width: '20%',
      fixed: 'left',
      render: (leaveFrom) => <>{dayjs(leaveFrom).format('DD-MM-YYYY HH:mm')}</>,
    },
    {
      title: 'Nghỉ đến',
      key: 'leaveTo_LeaveRequest',
      dataIndex: 'leaveTo',
      className: 'min-w-[80px]',
      width: '20%',
      render: (leaveTo) => <>{dayjs(leaveTo).format('DD-MM-YYYY HH:mm')}</>,
    },
    {
      title: 'Số giờ nghỉ',
      key: 'totalLeaveHour_LeaveRequest',
      dataIndex: 'totalLeaveHour',
      width: '20%',
    },
    {
      title: 'Trạng thái',
      key: 'status_LeaveRequest',
      dataIndex: 'status',
      width: '20%',
      render: (_, {status}) => (
        <>
          <Tag color={status === LEAVE_REQUEST_STATUS.APPROVED ? 'green' : 'red'}>
            {getStatusLeaveRequestText(status)}
          </Tag>
        </>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action_LeaveRequest',
      width: '20%',
      render: (_, item) =>
        item?.userId === userInfo?.userId && (
          <div className="text-lg flex gap-3">
            <div
              className={`${
                item?.status !== LEAVE_REQUEST_STATUS.APPROVED
                  ? 'hover:cursor-pointer text-success'
                  : 'hidden'
              }`}
              onClick={() => {
                setCurrentLQ(item);
                setIsOpenConfirmLQModal(true);
                setStatusCurrentLQ(LEAVE_REQUEST_STATUS.APPROVED);
              }}
            >
              <i title="Duyệt" className="bi bi-check-circle-fill"></i>
            </div>

            <span
              className={`${
                item?.status !== LEAVE_REQUEST_STATUS.REJECTED
                  ? 'hover:cursor-pointer text-primary-pink'
                  : 'hidden'
              }`}
              onClick={() => {
                setCurrentLQ(item);
                setIsOpenConfirmLQModal(true);
                setStatusCurrentLQ(LEAVE_REQUEST_STATUS.REJECTED);
              }}
            >
              <i title="Từ chối" className="bi bi-x-circle-fill"></i>
            </span>
          </div>
        ),
    },
  ];

  const onChangeChecked = (list) => {
    setCheckedList(list);
    setCheckAll(list.length === statusOptions.length);
  };
  const onCheckAllChange = (e) => {
    setCheckedList(e.target.checked ? Object.values(CHECKIN_STATUS) : []);
    setCheckAll(e.target.checked);
  };

  // control leave request form
  const handleSubmitForm = async (values) => {
    setSubmitFormLoading(true);

    let params = {
      deptId: values?.deptId,
      userId: values?.userId,
      leaveReason: values?.leaveReason,
      leaveFrom: values?.leaveFrom?.utc(true)?.format('YYYY-MM-DD HH:mm:ss'),
      leaveTo: values?.leaveTo?.utc(true)?.format('YYYY-MM-DD HH:mm:ss'),
      totalLeaveHour: values?.totalLeaveHour,
      note: values?.note,
      email: userInfo?.email,
    };

    let leaveOfAbsenceDetails = values?.leaveHourPerDay.map((item) => {
      return {
        ...item,
        leaveDate: item?.leaveDate?.utc(true)?.format('YYYY-MM-DD HH:mm:ss'),
        userId: userInfo?.userId,
      };
    });
    params.leaveOfAbsenceDetails = leaveOfAbsenceDetails;

    dispatch(controlLoading(true));

    try {
      const resLeaveOfAbsence = await postLeaveOfAbsenceRequestApi(params);

      if (resLeaveOfAbsence?.isSuccess && !!resLeaveOfAbsence?.data) {
        setOpen(false);
        dispatch(controlLoading(false));
        setSubmitFormLoading(false);
        let processExecutionID = resLeaveOfAbsence.data;
        openAmisLeaveOfAbsence(processExecutionID);
      } else {
        dispatch(controlLoading(false));
        setSubmitFormLoading(false);

        toast.error(resLeaveOfAbsence?.detail || 'Đăng ký nghỉ phép thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
      }
    } catch (err) {
      dispatch(controlLoading(false));
      setSubmitFormLoading(false);
      if (err?.response) {
        handleErrorResponse(err.response);
      } else {
        toast.error(err?.message || 'Đăng ký nghỉ phép thất bại!', {
          autoClose: 2000,
          position: 'top-center',
        });
      }
    }
  };

  const handleCancelForm = () => {
    setOpen(false);
  };

  // control update status leave of absence
  const handleUpdateStatusLeaveRequest = useCallback(
    async (data, status) => {
      const cloneLQData = [...dataLeaveRequest];
      let params = {
        id: data.id,
        userId: userInfo.userId,
        status: status,
      };

      dispatch(controlLoading(true));

      try {
        const resUpdateStatus = await updateStatusLeaveOfAbsenceApi(params);

        if (resUpdateStatus?.isSuccess && !!resUpdateStatus?.data) {
          cloneLQData[data.key] = {...resUpdateStatus.data, key: data.key};
          setDataLeaveRequest(cloneLQData);

          dispatch(controlLoading(false));
          toast.success(resUpdateStatus?.detail || 'Cập nhật thành công!', {
            autoClose: 2000,
            position: 'top-center',
          });
        } else {
          dispatch(controlLoading(false));
          toast.error(resUpdateStatus?.detail || 'Cập nhật trạng thái thất bại!', {
            autoClose: 2000,
            position: 'top-center',
          });
        }
      } catch (err) {
        dispatch(controlLoading(false));
        if (err?.response) {
          handleErrorResponse(err.response);
        } else {
          toast.error(err?.message || 'Cập nhật trạng thái thất bại!', {
            autoClose: 2000,
            position: 'top-center',
          });
        }
      }
    },
    [dataLeaveRequest, userInfo]
  );

  return (
    <div>
      <div className="container 2xl:max-w-[1400px] lg:max-w-[1110px] px-4 mx-auto">
        <h1 className="text-center max-md:text-2xl">THEO DÕI NGÀY CÔNG</h1>

        <div className="overviewSection grid lg:grid-cols-5 md:grid-cols-6 grid-cols-4 gap-4">
          <div className="lg:col-span-1 col-span-2">
            <SimpleCardItem title={'Đi trễ'} totalNum={overviewData?.totalLateCheckInDays || 0} />
          </div>
          <div className="lg:col-span-1 col-span-2">
            <SimpleCardItem title={'Về sớm'} totalNum={overviewData?.totalEarlyCheckOutDays || 0} />
          </div>
          <div className="lg:col-span-1 col-span-2">
            <SimpleCardItem
              title={'Quên checkin'}
              totalNum={overviewData?.totalForgetCheckinDays || 0}
            />
          </div>
          <div className="lg:col-span-1 col-span-2 md:col-start-2">
            <SimpleCardItem
              title={'Quên checkout'}
              totalNum={overviewData?.totalForgetCheckoutDays || 0}
            />
          </div>
          <div className="lg:col-span-1 col-span-2 md:col-start-4 col-start-2">
            <SimpleCardItem
              title={'Làm thiếu giờ'}
              unit="giờ"
              totalNum={overviewData?.totalMissingTime || 0}
            />
          </div>
        </div>

        <div className="firstSection py-10 md:py-16">
          <div className="flex justify-center gap-4">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Select
                    showSearch
                    placeholder="Phòng ban"
                    optionFilterProp="children"
                    className="max-w-[400px] w-full"
                    onChange={handleChangeDepartmentSelect}
                    options={departmentOptions}
                    notFoundContent={<p>Không có dữ liệu</p>}
                    value={departmentId}
                  />
                  {error.department && (
                    <p className="text-danger text-sm my-1">{error.department}</p>
                  )}
                </div>
                <div>
                  <Select
                    showSearch
                    placeholder="Họ và tên"
                    optionFilterProp="children"
                    className="max-w-[400px] w-full"
                    onChange={handleChangeUserSelect}
                    onSearch={handleSearchUser}
                    filterOption={false}
                    options={userOptions}
                    notFoundContent={fetching ? <Spin size="small" /> : <p>Không có dữ liệu</p>}
                    value={userId}
                  />
                  {error.user && <p className="text-danger text-sm my-1">{error.user}</p>}
                </div>
                <div>
                  <RangePicker
                    placement={'topLeft'}
                    className="max-w-[400px] w-full"
                    value={dates || datevalue}
                    disabledDate={disabledDate}
                    onCalendarChange={(val) => {
                      setDates(val);
                    }}
                    onChange={(val) => {
                      setDateValue(val);
                    }}
                    onOpenChange={onOpenChange}
                    changeOnBlur
                    format={DATE_FORMAT}
                    popupClassName="customRangePicker"
                  />
                  {error.dateRange && <p className="text-danger text-sm mt-1">{error.dateRange}</p>}
                </div>
                {/* -----START LEAVE REQUEST FORM----- */}
                
                <div>
                  <Button
                    className="bg-primary-pink"
                    type="primary"
                    onClick={() => {
                      setOpen(true);
                    }}
                  >
                    Đăng ký nghỉ phép
                  </Button>
                  <div>
                    <LeaveRequestForm
                      open={open}
                      onCreate={handleSubmitForm}
                      onCancel={handleCancelForm}
                      confirmLoading={submitFormLoading}
                      maskClosable={false}
                      deptOptions={departmentOptions}
                      userInfo={userInfo}
                    />
                  </div>
                </div>
                {/* -----END LEAVE REQUEST FORM----- */}
                
                <div> 
                    <Button
                      className='bg-primary' 
                      type="primary"
                       onClick={() => {
                        setOpen(true);
                       }}
                    >
                      Đăng kí gặp khách hàng
                    </Button>

                    <div>
                       <CF
                        openForm={open}
                        CreateForm={handleSubmitForm}
                        CancelForm={handleCancelForm}
                        confirmForm={submitFormLoading}
                        maskClosable={false}
                        depOption={departmentOptions}
                        userInfo={userInfo}
                      />
                    </div>
                </div>


              </div>
              <div className={`${dataCheckinInfo?.length > 0 ? 'visible' : 'invisible'}`}>
                <Checkbox
                  className="mr-4 mb-2"
                  indeterminate={checkedList.length === 0 ? undefined : !checkAll}
                  onChange={onCheckAllChange}
                  checked={checkAll}
                >
                  Tất cả
                </Checkbox>
                <CheckboxGroup
                  className="gap-x-4"
                  options={statusOptions}
                  value={checkedList}
                  onChange={onChangeChecked}
                />
              </div>
            </div>
            <Button onClick={() => handleSearch(userId)} type="primary" icon={<SearchOutlined />}>
              Tìm
            </Button>
          </div>

          <div className="mt-10 mx-auto max-w-5xl overflow-x-auto">
            <Table columns={columnFirst} dataSource={dataCheckinFirst} pagination={false} />
          </div>

          <div className="mt-10 lg:mt-32 mx-auto max-w-5xl lg:py-10 py-4 px-5 bg-background-blue rounded-xl">
            <h2 className="text-center max-md:text-xl mt-0">Thông tin chi tiết</h2>
            <div className="mt-10 mx-auto max-w-5xl overflow-x-auto">
              <Table
                columns={columnSecond}
                dataSource={dataCheckinSecond}
                pagination={false}
                rowClassName={'bg-white'}
              />
            </div>
          </div>

          <div className="mt-10 lg:mt-32 mx-auto max-w-5xl lg:py-10 py-4 px-5 bg-background-red-2 rounded-xl">
            <h2 className="text-center max-md:text-xl mt-0">Ngày công trong tuần trước</h2>
            <div className="mt-10 mx-auto max-w-5xl overflow-x-auto">
              <Table
                columns={columnWeekly}
                dataSource={dataCheckinLastWeek}
                pagination={false}
                rowClassName={'bg-white'}
              />
            </div>
          </div>

          <div className="mt-10 lg:mt-32 mx-auto max-w-5xl lg:py-10 py-4 px-5 bg-background-blue rounded-xl">
            <h2 className="text-center max-md:text-xl mt-0">Ngày nghỉ phép</h2>
            <div className="mt-10 mx-auto max-w-5xl overflow-x-auto">
              <Table
                columns={columnLeaveRequest}
                dataSource={dataLeaveRequest}
                pagination={false}
                rowClassName={'bg-white'}
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="transparent">
                      {record?.userId && (
                        <div>
                          <span className="font-bold">Tên nhân viên: </span>
                          {userOptions.find((item) => item.value === record.userId)?.label}
                        </div>
                      )}
                      {record?.leaveReason && (
                        <div>
                          <span className="font-bold">Lý do nghỉ: </span>
                          {record?.leaveReason}
                        </div>
                      )}
                      {record?.note && (
                        <div>
                          <span className="font-bold">Ghi chú: </span>
                          {record?.note}
                        </div>
                      )}
                    </div>
                  ),
                  rowExpandable: (record) => !!record?.leaveReason,
                  expandedRowClassName: () => 'bg-white',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={isOpenConfirmLQModal}
        closeIcon={false}
        title={`Xác nhận ${
          statusCurrentLQ === LEAVE_REQUEST_STATUS.APPROVED
            ? 'duyệt'
            : statusCurrentLQ === LEAVE_REQUEST_STATUS.REJECTED
            ? 'từ chối'
            : '...'
        }`}
        okText={`${
          statusCurrentLQ === LEAVE_REQUEST_STATUS.APPROVED
            ? 'Duyệt'
            : statusCurrentLQ === LEAVE_REQUEST_STATUS.REJECTED
            ? 'Từ chối'
            : 'OK'
        }`}
        cancelText="Hủy"
        width={300}
        centered
        onCancel={() => {
          resetStateAfterCloseModal();
        }}
        onOk={() => {
          handleUpdateStatusLeaveRequest(currentLQ, statusCurrentLQ);
          resetStateAfterCloseModal();
        }}
        okButtonProps={{danger: statusCurrentLQ === LEAVE_REQUEST_STATUS.REJECTED}}
      >
        <div>
          {!!currentLQ?.userId && (
            <div>
              Tên nhân viên:{' '}
              <span style={{fontWeight: 700}}>
                {userOptions.find((item) => item.value === currentLQ.userId)?.label}
              </span>
            </div>
          )}
          {!!currentLQ?.leaveFrom && (
            <div>
              Nghỉ từ:{' '}
              <span style={{fontWeight: 700}}>
                {dayjs(currentLQ?.leaveFrom).format('DD-MM-YYYY HH:mm')}
              </span>
            </div>
          )}
          {!!currentLQ?.leaveTo && (
            <div>
              Nghỉ đến:{' '}
              <span style={{fontWeight: 700}}>
                {dayjs(currentLQ?.leaveTo).format('DD-MM-YYYY HH:mm')}
              </span>
            </div>
          )}
          {!!currentLQ?.totalLeaveHour && (
            <div>
              Số giờ nghỉ: <span style={{fontWeight: 700}}>{currentLQ?.totalLeaveHour}</span>
            </div>
          )}
          {!!currentLQ?.leaveReason && (
            <div>
              Lý do: <span style={{fontWeight: 700}}>{currentLQ?.leaveReason}</span>
            </div>
          )}
          {!!currentLQ?.note && (
            <div>
              Ghi chú: <span style={{fontWeight: 700}}>{currentLQ?.note}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CheckIn;
