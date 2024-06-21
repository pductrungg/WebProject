import {useState, useCallback} from 'react';
import {Form, Input, Modal, DatePicker, Select, InputNumber, Col, Row} from 'antd';
import dayjs from 'dayjs';
import {LEAVE_TIME_OPTIONS, LEAVE_TIME_HOUR, GET_DAY_FUNC_TYPE, WORKING_TIME} from '../../constant';
import {getDayToCalcTime, calcLeaveHours, checkWeekend} from '../../utils/helpers';

const LeaveRequestForm = ({
  open,
  onCreate,
  onCancel,
  confirmLoading,
  deptOptions,
  userInfo,
  ...props
}) => {
  const [form] = Form.useForm();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [leaveTime, setLeaveTime] = useState(null);
  const [isHiddenField, setIsHiddenField] = useState(true);
  const [formValues, setFormValues] = useState(null);
  const [isOpenLeaveHourField, setIsOpenLeaveHourField] = useState(false);

  const rangeNum = useCallback((start, end) => {
    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  }, []);

  const resetState = useCallback(() => {
    setLeaveTime(null);
    setIsHiddenField(true);
    setIsOpenLeaveHourField(false);
    setFormValues(null);
  }, []);

  const getFormValues = useCallback(() => {
    setFormValues(form.getFieldsValue(true));
  }, [form]);

  const getDayNotWeekend = useCallback((dayStart, numDay = 1) => {
    let dayEnd = dayjs(dayStart).add(numDay, 'day');

    for (let i = numDay + 1; checkWeekend(dayEnd); i++) {
      dayEnd = dayjs(dayStart).add(i, 'day');
    }
    return dayEnd;
  }, []);

  const getLeaveTime = useCallback((start, end) => { // calculateDay
    let totalLeaveHours = 0;
    let leaveTimePerDay = [];
    if (checkWeekend(start) && checkWeekend(end)) {
      return totalLeaveHours;
    }

    let fromDateString = getDayToCalcTime(GET_DAY_FUNC_TYPE.TO_JSON, start);
    let toDateString = getDayToCalcTime(GET_DAY_FUNC_TYPE.TO_JSON, end);

    if (fromDateString === toDateString) {
      totalLeaveHours = calcLeaveHours(start, end);
      leaveTimePerDay.push({
        leaveDate: dayjs(start)
          .set('h', WORKING_TIME.NEW_DAY[0])
          .set('m', WORKING_TIME.NEW_DAY[1])
          .set('s', WORKING_TIME.NEW_DAY[2]),
        leaveHours: totalLeaveHours,
      });
    } else {
      let dateCalc = dayjs(start);

      for (let i = 1; fromDateString !== toDateString; i++) {
        if (checkWeekend(dateCalc)) {
          dateCalc = dayjs(start).add(i, 'day');
          fromDateString = getDayToCalcTime(GET_DAY_FUNC_TYPE.TO_JSON, dateCalc);
          continue;
        }

        if (i === 1) {
          let leaveTime = calcLeaveHours(
            dateCalc,
            getDayToCalcTime(GET_DAY_FUNC_TYPE.END_DAY, dateCalc)
          );
          totalLeaveHours += leaveTime;
          leaveTimePerDay.push({
            leaveDate: dayjs(dateCalc)
              .set('h', WORKING_TIME.NEW_DAY[0])
              .set('m', WORKING_TIME.NEW_DAY[1])
              .set('s', WORKING_TIME.NEW_DAY[2]),
            leaveHours: leaveTime,
          });
        } else {
          let leaveTime = calcLeaveHours(
            getDayToCalcTime(GET_DAY_FUNC_TYPE.START_DAY, dateCalc),
            getDayToCalcTime(GET_DAY_FUNC_TYPE.END_DAY, dateCalc)
          );
          totalLeaveHours += leaveTime;
          leaveTimePerDay.push({
            leaveDate: dayjs(dateCalc)
              .set('h', WORKING_TIME.NEW_DAY[0])
              .set('m', WORKING_TIME.NEW_DAY[1])
              .set('s', WORKING_TIME.NEW_DAY[2]),
            leaveHours: leaveTime,
          });
        }

        dateCalc = dayjs(start).add(i, 'day');
        fromDateString = getDayToCalcTime(GET_DAY_FUNC_TYPE.TO_JSON, dateCalc);
      }

      if (fromDateString === toDateString) {
        if (!checkWeekend(dateCalc)) {
          let leaveTime = calcLeaveHours(
            getDayToCalcTime(GET_DAY_FUNC_TYPE.START_DAY, dateCalc),
            end
          );
          totalLeaveHours += leaveTime;
          leaveTimePerDay.push({
            leaveDate: dayjs(end)
              .set('h', WORKING_TIME.NEW_DAY[0])
              .set('m', WORKING_TIME.NEW_DAY[1])
              .set('s', WORKING_TIME.NEW_DAY[2]),
            leaveHours: leaveTime,
          });
        }
      }
    }

    return {totalLeaveHours, leaveTimePerDay};
  }, []);

  const handleChangeLeaveTimeField = (value) => {
    if (value > 0) {
      form.setFieldValue('totalLeaveHour', value);
      isOpenLeaveHourField && setIsOpenLeaveHourField(false);
    } else {
      form.resetFields(['totalLeaveHour', 'leaveHourPerDay']);
      !isOpenLeaveHourField && setIsOpenLeaveHourField(true);
    }
    setLeaveTime(value);

    if (value !== LEAVE_TIME_HOUR.A_DAY) {
      if (isHiddenField) setIsHiddenField(false);

      if (!!form.getFieldValue('dayOff')) form.resetFields(['dayOff']);
    }

    
    switch (value) {
      case LEAVE_TIME_HOUR.A_DAY: {
        setIsHiddenField(true);

        let dayApply = getDayNotWeekend(dayjs());

        form.setFieldValue('dayOff', dayApply);
        handleChangeDayOff(dayApply);

        break;
      }

      case LEAVE_TIME_HOUR.TWO_DAYS: {
        let dayApplyFromDate = getDayNotWeekend(dayjs());
        let dayApplyToDate = getDayNotWeekend(dayApplyFromDate);

        form.setFieldValue(
          'leaveFrom',
          dayjs(dayApplyFromDate)
            .set('h', WORKING_TIME.START[0])
            .set('m', WORKING_TIME.START[1])
            .set('s', WORKING_TIME.START[2])
        );

        form.setFieldValue(
          'leaveTo',
          dayjs(dayApplyToDate)
            .set('h', WORKING_TIME.END[0])
            .set('m', WORKING_TIME.END[1])
            .set('s', WORKING_TIME.END[2])
        );

        let leaveHourPerDay = [
          {
            leaveDate: dayjs(dayApplyFromDate)
              .set('h', WORKING_TIME.NEW_DAY[0])
              .set('m', WORKING_TIME.NEW_DAY[1])
              .set('s', WORKING_TIME.NEW_DAY[2]),
            leaveHours: LEAVE_TIME_HOUR.A_DAY,
          },
          {
            leaveDate: dayjs(dayApplyToDate)
              .set('h', WORKING_TIME.NEW_DAY[0])
              .set('m', WORKING_TIME.NEW_DAY[1])
              .set('s', WORKING_TIME.NEW_DAY[2]),
            leaveHours: LEAVE_TIME_HOUR.A_DAY,
          },
        ];

        form.setFieldValue('leaveHourPerDay', leaveHourPerDay);

        break;
      }

      // case LEAVE_TIME_HOUR.SEVERAL_DAYS:
      case LEAVE_TIME_HOUR.OTHER:
      default: {
        form.resetFields(['leaveFrom', 'leaveTo']);
        break;
      }
    }
  };

  const handleChangeDayOff = (date) => {
    form.setFieldValue(
      'leaveFrom',
      dayjs(date)
        .set('h', WORKING_TIME.START[0])
        .set('m', WORKING_TIME.START[1])
        .set('s', WORKING_TIME.START[2])
    );

    form.setFieldValue(
      'leaveTo',
      dayjs(date)
        .set('h', WORKING_TIME.END[0])
        .set('m', WORKING_TIME.END[1])
        .set('s', WORKING_TIME.END[2])
    );

    form.setFieldValue('leaveHourPerDay', [
      {
        leaveDate: dayjs(date)
          .set('h', WORKING_TIME.NEW_DAY[0])
          .set('m', WORKING_TIME.NEW_DAY[1])
          .set('s', WORKING_TIME.NEW_DAY[2]),
        leaveHours: LEAVE_TIME_HOUR.A_DAY,
      },
    ]);
  };

  const onChangeTime = () => {
    if (form.getFieldValue('leaveTime') === LEAVE_TIME_HOUR.TWO_DAYS) {
      if (!!form.getFieldValue('leaveFrom')) {
        let dayApplyToDate = getDayNotWeekend(form.getFieldValue('leaveFrom'));

        form.setFieldValue(
          'leaveTo',
          dayjs(dayApplyToDate)
            .set('h', WORKING_TIME.END[0])
            .set('m', WORKING_TIME.END[1])
            .set('s', WORKING_TIME.END[2])
        );

        let leaveHourPerDay = [
          {
            leaveDate: dayjs(form.getFieldValue('leaveFrom'))
              .set('h', WORKING_TIME.NEW_DAY[0])
              .set('m', WORKING_TIME.NEW_DAY[1])
              .set('s', WORKING_TIME.NEW_DAY[2]),
            leaveHours: LEAVE_TIME_HOUR.A_DAY,
          },
          {
            leaveDate: dayjs(dayApplyToDate)
              .set('h', WORKING_TIME.NEW_DAY[0])
              .set('m', WORKING_TIME.NEW_DAY[1])
              .set('s', WORKING_TIME.NEW_DAY[2]),
            leaveHours: LEAVE_TIME_HOUR.A_DAY,
          },
        ];

        form.setFieldValue('leaveHourPerDay', leaveHourPerDay);
      } else {
        form.resetFields(['leaveTo', 'leaveHourPerDay']);
      }
    } else {
      if (!!form.getFieldValue('leaveFrom') && !!form.getFieldValue('leaveTo')) {
        let leaveFromDate = form.getFieldValue('leaveFrom');
        let leaveToDate = form.getFieldValue('leaveTo');

        const {totalLeaveHours, leaveTimePerDay} = getLeaveTime(leaveFromDate, leaveToDate);

        if (totalLeaveHours > 0) {
          form.setFieldValue('totalLeaveHour', totalLeaveHours);
          form.setFieldValue('leaveHourPerDay', leaveTimePerDay);
        }
      } else {
        if (!!form.getFieldValue('totalLeaveHour')) {
          form.resetFields(['totalLeaveHour', 'leaveHourPerDay']);
        }
      }
    }
  };

  const handleChangeLeaveTimePerDay = (value) => {
    if (value > 0) {
      let leaveTimePerDay = form.getFieldValue('leaveHourPerDay');
      let totalLeaveTime = leaveTimePerDay.reduce((acc, cur) => acc + cur.leaveHours, 0);

      form.setFieldValue('totalLeaveHour', totalLeaveTime);
    } else form.resetFields(['totalLeaveHour']);
  };

  return (
    <div>
      <Modal
        open={open}
        closeIcon={!confirmLoading}
        title="Đăng ký nghỉ phép"
        okText="Đăng ký"
        cancelText="Hủy"
        cancelButtonProps={{disabled: confirmLoading}}
        okButtonProps={{disabled: confirmLoading}}
        centered
        onCancel={() => {
          form.resetFields();
          resetState();
          onCancel();
        }}
        onOk={() => {
          form
            .validateFields()
            .then(() => {
              setOpenConfirm(true);
              getFormValues();
            })
            .catch((info) => {
              console.log('Validate Failed:', info);
            });
        }}
        className="leaveRequestFormModal"
        {...props}
      >
        <Form
          form={form}
          layout="vertical"
          name="leave_request_form_in_modal"
          initialValues={{
            deptId: userInfo?.deptId ? userInfo.deptId : null,
            userId: userInfo?.userId ? userInfo.userId : null,
            leaveHourPerDay: [],
          }}
        >
          <Form.Item
            name="deptId"
            label="Bộ phận/Phòng ban"
            rules={[
              {
                required: true,
                message: 'Vui lòng chọn bộ phận/phòng ban',
              },
            ]}
            style={{marginBottom: '1rem'}}
          >
            <Select
              showSearch
              placeholder="Bộ phận/Phòng ban"
              optionFilterProp="children"
              notFoundContent={<p>Không có dữ liệu</p>}
              disabled={!!userInfo?.deptId}
            >
              {!!userInfo?.deptId && (
                <Select.Option value={userInfo.deptId}>
                  {deptOptions.find((item) => item.value === userInfo.deptId)?.label || ''}
                </Select.Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="userId"
            label="Tên nhân viên"
            rules={[
              {
                required: true,
                message: 'Vui lòng chọn tên nhân viên',
              },
            ]}
            style={{marginBottom: '1rem'}}
          >
            <Select
              showSearch
              placeholder="Tên nhân viên"
              optionFilterProp="children"
              notFoundContent={<p>Không có dữ liệu</p>}
              disabled={!!userInfo?.fullName && !!userInfo?.userId}
            >
              {!!userInfo?.fullName && !!userInfo?.userId && (
                <Select.Option value={userInfo.userId}>{userInfo.fullName}</Select.Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="leaveReason"
            label="Lý do nghỉ phép"
            rules={[
              {
                required: true,
                message: 'Vui lòng nhập lý do nghỉ phép',
              },
            ]}
            style={{marginBottom: '1rem'}}
          >
            <Input placeholder="Lý do nghỉ phép" type="textarea" />
          </Form.Item>

          <Form.Item
            name="leaveTime"
            label="Thời gian nghỉ"
            rules={[
              {
                required: true,
                message: 'Vui lòng chọn thời gian nghỉ',
              },
            ]}
            style={{marginBottom: '1rem'}}
          >
            <Select
              placeholder="Chọn thời gian nghỉ"
              optionFilterProp="children"
              notFoundContent={<p>Không có dữ liệu</p>}
              onChange={(e) => handleChangeLeaveTimeField(e)}
            >
              {LEAVE_TIME_OPTIONS?.map((dept, index) => {
                return (
                  <Select.Option key={index} value={dept.value}>
                    {dept.label}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>

          {leaveTime === LEAVE_TIME_HOUR.A_DAY && (
            <Form.Item
              name="dayOff"
              label="Ngày nghỉ"
              rules={[
                {
                  type: 'object',
                  required: true,
                  message: 'Vui lòng chọn ngày nghỉ',
                },
                () => ({
                  validator(_, value) {
                    if (!value || !checkWeekend(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Ngày nghỉ đang chọn là cuối tuần!'));
                  },
                }),
              ]}
              style={{marginBottom: '1rem'}}
            >
              <DatePicker
                onChange={handleChangeDayOff}
                changeOnBlur
                placeholder="Chọn ngày nghỉ"
                format="DD-MM-YYYY"
                style={{
                  width: '100%',
                }}
              />
            </Form.Item>
          )}

          <Form.Item
            hidden={isHiddenField}
            name="leaveFrom"
            label="Nghỉ từ"
            rules={[
              {
                type: 'object',
                required: true,
                message: 'Vui lòng chọn ngày nghỉ bắt đầu',
              },
              () => ({
                validator(_, value) {
                  if (!value || !checkWeekend(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Ngày nghỉ đang chọn là cuối tuần!'));
                },
              }),
            ]}
            style={{marginBottom: '1rem'}}
          >
            <DatePicker
              changeOnBlur
              placeholder="Nghỉ từ"
              showTime={{defaultValue: dayjs('09:00:00', 'HH:mm:ss')}}
              format="DD-MM-YYYY HH:mm"
              style={{
                width: '100%',
              }}
              disabledTime={
                !isOpenLeaveHourField
                  ? () => ({
                      disabledHours: () => rangeNum(0, 23),
                      disabledMinutes: () => rangeNum(0, 59),
                    })
                  : null
              }
              onChange={onChangeTime}
              minuteStep={5}
              popupClassName="customDatePicker"
            />
          </Form.Item>

          <Form.Item
            hidden={isHiddenField}
            name="leaveTo"
            label="Nghỉ đến"
            rules={[
              {type: 'object', required: true, message: 'Vui lòng chọn ngày nghỉ kết thúc'},
              ({getFieldValue}) => ({
                validator(_, value) {
                  if (!value || getFieldValue('leaveFrom') < value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Ngày nghỉ kết thúc phải lớn hơn ngày bắt đầu!'));
                },
              }),
              () => ({
                validator(_, value) {
                  if (!value || !checkWeekend(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Ngày nghỉ đang chọn là cuối tuần!'));
                },
              }),
            ]}
            style={{marginBottom: '1rem'}}
          >
            <DatePicker
              changeOnBlur
              placeholder="Nghỉ đến"
              showTime={{defaultValue: dayjs('18:00:00', 'HH:mm:ss')}}
              format="DD-MM-YYYY HH:mm"
              style={{
                width: '100%',
              }}
              disabledDate={(current) => {
                return (
                  current &&
                  form.getFieldValue('leaveFrom') &&
                  current < form.getFieldValue('leaveFrom')
                );
              }}
              disabledTime={
                !isOpenLeaveHourField
                  ? () => ({
                      disabledHours: () => rangeNum(0, 23),
                      disabledMinutes: () => rangeNum(0, 59),
                    })
                  : null
              }
              disabled={!isOpenLeaveHourField}
              onChange={onChangeTime}
              minuteStep={5}
              popupClassName="customDatePicker"
            />
          </Form.Item>

          <Form.Item
            name="totalLeaveHour"
            label="Số giờ làm việc xin nghỉ"
            rules={[
              {
                required: true,
                message: 'Vui lòng nhập số giờ làm việc xin nghỉ',
              },
            ]}
            style={{marginBottom: '0.5rem'}}
          >
            <InputNumber
              style={{
                width: '100%',
              }}
              placeholder="Tổng số giờ làm việc xin nghỉ"
              disabled
            />
          </Form.Item>

          {isOpenLeaveHourField && (
            <div style={{marginBottom: '1rem'}}>
              <Row style={{textAlign: 'center'}}>
                <Col span={12}>Ngày</Col>
                <Col span={12}>Số giờ nghỉ</Col>
              </Row>

              <Form.List name="leaveHourPerDay">
                {(fields) => (
                  <div>
                    {fields.map((field, index) => (
                      <Row key={field.key} gutter={16} className="testrow">
                        {(index === 0 ||
                          index === form.getFieldValue('leaveHourPerDay').length - 1) && (
                          <>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, 'leaveDate']}
                                style={{marginBottom: '0.5rem'}}
                                span={12}
                              >
                                <DatePicker
                                  placeholder="Ngày nghỉ"
                                  format="DD-MM-YYYY"
                                  disabled
                                  style={{
                                    width: '100%',
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, 'leaveHours']}
                                style={{marginBottom: '0.5rem'}}
                                span={12}
                              >
                                <InputNumber
                                  style={{
                                    width: '100%',
                                  }}
                                  placeholder="Số giờ nghỉ"
                                  onChange={handleChangeLeaveTimePerDay}
                                  max={LEAVE_TIME_HOUR.A_DAY}
                                />
                              </Form.Item>
                            </Col>
                          </>
                        )}
                      </Row>
                    ))}
                  </div>
                )}
              </Form.List>
            </div>
          )}

          <Form.Item name="note" label="Ghi chú">
            <Input placeholder="Ghi chú" type="textarea" />
          </Form.Item>
        </Form>
        <div className="customSpaceForm"></div>
      </Modal>

      <Modal
        open={openConfirm}
        closeIcon={false}
        title="Xác nhận đăng ký"
        okText="Nộp đơn"
        cancelText="Hủy"
        width={300}
        centered
        onCancel={() => {
          setOpenConfirm(false);
        }}
        onOk={() => {
          setOpenConfirm(false);
          resetState();
          onCreate(form.getFieldsValue(true));
          form.resetFields();
        }}
      >
        <div>
          <div>
            Nghỉ từ:{' '}
            <span style={{fontWeight: 700}}>
              {!!formValues?.leaveFrom && formValues?.leaveFrom?.format('DD-MM-YYYY HH:mm')}
            </span>
          </div>
          <div>
            Nghỉ đến:{' '}
            <span style={{fontWeight: 700}}>
              {!!formValues?.leaveTo && formValues?.leaveTo?.format('DD-MM-YYYY HH:mm')}
            </span>
          </div>
          <div>
            Số giờ nghỉ:{' '}
            <span style={{fontWeight: 700}}>
              {!!formValues?.totalLeaveHour && formValues?.totalLeaveHour}
            </span>
          </div>
          <div>
            Lý do:{' '}
            <span style={{fontWeight: 700}}>
              {!!formValues?.leaveReason && formValues?.leaveReason}
            </span>
          </div>
          {!!formValues?.note && (
            <div>
              Ghi chú: <span style={{fontWeight: 700}}>{formValues?.note}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default LeaveRequestForm;
