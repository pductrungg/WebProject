import {useState, useCallback} from 'react';
import {Form, Input, Modal, DatePicker, Select, InputNumber, Col, Row} from 'antd';
import dayjs from 'dayjs';
import {LEAVE_TIME_OPTIONS, LEAVE_TIME_HOUR, GET_DAY_FUNC_TYPE, WORKING_TIME} from '../../constant';
import {getDayToCalcTime, calcLeaveHours, checkWeekend, getDataFromToken,calMeetHours} from '../../utils/helpers';
import { iteratee } from 'lodash';
import { current } from '@reduxjs/toolkit';

const CF = ({
    openForm,
    CreateForm,
    CancelForm,
    confirmForm,
    depOption,
    userInfo,
    ...props
}) => {
    const [form] = Form.useForm();
    const [openConfirm, setOpenConfirm] = useState(false);
    const [leaveTime, setLeaveTime]  = useState(null);
    const [isHiddenField, setIsHiddenField] = useState(true);
    const [formValues, setFormValues] = useState(null);
    const [isOpenLeaveHourField, setIsOpenLeaveHourField] = useState(false);
    
    const numRange = useCallback((start, end) => {
        const res = [];
        for(let i=start; i<=end; i++){
            res.push(i);
        }
        return res;
    }, []);

    const reset = useCallback(() => {
        setLeaveTime(null);
        setIsHiddenField(true);
        setIsOpenLeaveHourField(false);
        setFormValues(null);
    }, []);

    const getValue = useCallback(() => {
        setFormValues(form.getFieldsValue(true));
    }, [form]);

    const calDayNoWK = useCallback((start_day, numDay = 1) => {
        // let end_day = dayjs(start_day)
        let end_day = dayjs(start_day).add(numDay,'day')
         for(let i=numDay+1; checkWeekend(end_day);i++){
            end_day = dayjs(start_day).add(i,'day');
         }
         return end_day;
    }, []);

    const calculateDay = useCallback((start, end) => {
        let totalHours = 0;
        let timePerDay = [];
        if(checkWeekend(start) && checkWeekend(end)){
            return totalHours;
        }

        let fromDatetoString = getDayToCalcTime(GET_DAY_FUNC_TYPE.TO_JSON, start);
        let toDateString = getDayToCalcTime(GET_DAY_FUNC_TYPE.TO_JSON, end);

        if(fromDatetoString === toDateString){
            totalHours = calMeetHours(start, end);
            timePerDay.push({
                leaveDate: dayjs(start)
                .set('h', WORKING_TIME.NEW_DAY[0])
                .set('m',WORKING_TIME.NEW_DAY[1])
                .set('s',WORKING_TIME.NEW_DAY[2]),
                totalH: totalHours,
            });
        }else{
            let day_cal = dayjs(start);

            for (let i=1; fromDatetoString !== toDateString; i++){
                if(checkWeekend(day_cal)){
                    day_cal = dayjs(start).add(i, 'day');
                    fromDatetoString = getDayToCalcTime(GET_DAY_FUNC_TYPE.TO_JSON, day_cal);
                    continue;
                }

                if(i === 1){
                    let leaveTime = calMeetHours(
                        day_cal,
                        getDayToCalcTime(GET_DAY_FUNC_TYPE.END_DAY,day_cal)
                    );
                    totalHours += leaveTime;
                    timePerDay.push({
                        leaveDate: dayjs(day_cal)
                            .set('h',WORKING_TIME.NEW_DAY[0])
                            .set('m',WORKING_TIME.NEW_DAY[1])
                            .set('s',WORKING_TIME.NEW_DAY[2]),
                        totalH: leaveTime,
                    });
                } else {
                    let leaveTime = calMeetHours(
                        getDayToCalcTime(GET_DAY_FUNC_TYPE.START_DAY, day_cal),
                        getDayToCalcTime(GET_DAY_FUNC_TYPE.END_DAY, day_cal)
                    );
                    totalHours += leaveTime;
                    timePerDay.push({
                        leaveDate: dayjs(day_cal)
                            .set('h',WORKING_TIME.NEW_DAY[0])
                            .set('m',WORKING_TIME.NEW_DAY[1])
                            .set('s',WORKING_TIME.NEW_DAY[2]),
                        totalH: leaveTime,
                    });
                }
                day_cal = dayjs(start).add(i, 'day');
                fromDatetoString = getDayToCalcTime(GET_DAY_FUNC_TYPE.TO_JSON, day_cal);
            }

            if(fromDatetoString === toDateString){
                if(!checkWeekend(day_cal)){
                    let leaveTime = calMeetHours(
                        getDayToCalcTime(GET_DAY_FUNC_TYPE.START_DAY, day_cal),
                        end
                    );
                    totalHours += leaveTime;
                    timePerDay.push({
                        leaveDate: dayjs(end)
                            .set('h',WORKING_TIME.NEW_DAY[0])
                            .set('m',WORKING_TIME.NEW_DAY[1])
                            .set('s', WORKING_TIME.NEW_DAY[2]),
                        totalH: leaveTime,
                    });
                }
            }
        }return {totalHours,timePerDay};
    }, []);

    const handleChange = (value) => {
        if(value > 0){
            form.setFieldValue('totalHour', value);
            setIsOpenLeaveHourField && setIsOpenLeaveHourField(false);
        }else {
            form.resetFields(['totalHour','hourPerDay']);
            !setIsOpenLeaveHourField && setIsOpenLeaveHourField(true);
        }
        setLeaveTime(value);

        if(value !== LEAVE_TIME_HOUR.A_DAY){
            if(isHiddenField){
                setIsHiddenField(false);
            }
            if(!!form.getFieldValue('dayGo')) form.resetFields(['dayGo']);
        }

        switch(value){
            case LEAVE_TIME_HOUR.A_DAY:{
                setIsHiddenField(true);

                let dayApply = calDayNoWK(dayjs());

                form.setFieldValue('dayGo',dayApply);
                handleDayOff(dayApply);

                break;
            }
            case LEAVE_TIME_HOUR.TWO_DAYS:{
                let dayApplyFromDate = calDayNoWK(dayjs());
                let dayApplyToDate = calDayNoWK(dayApplyFromDate);

                form.setFieldValue(
                    'goFrom',
                    dayjs(dayApplyFromDate)
                        .set('h',WORKING_TIME.START[0])
                        .set('m',WORKING_TIME.START[1])
                        .set('s',WORKING_TIME.START[2])
                );
                form.setFieldValue(
                    'dayBack',
                    dayjs(dayApplyToDate)
                        .set('h',WORKING_TIME.END[0])
                        .set('m',WORKING_TIME.NEW_DAY[1])
                        .set('s',WORKING_TIME.NEW_DAY[2]),
                );

                let hourPerDay = [
                    {
                        leaveDate: dayjs(dayApplyFromDate)
                            .set('h',WORKING_TIME.NEW_DAY[0])
                            .set('m',WORKING_TIME.NEW_DAY[1])
                            .set('s',WORKING_TIME.NEW_DAY[2]),
                        totalH: LEAVE_TIME_HOUR.A_DAY,
                    },
                    {
                        leaveDate:dayjs(dayApplyToDate)
                            .set('h',WORKING_TIME.NEW_DAY[0])
                            .set('m',WORKING_TIME.NEW_DAY[1])
                            .set('s',WORKING_TIME.NEW_DAY[2]),
                        totalH: LEAVE_TIME_HOUR.A_DAY,
                    },
                ];
                form.setFieldValue('hourPerDay', hourPerDay);
                break;
            }
            case LEAVE_TIME_HOUR.OTHER:
            default:{
                form.resetFields(['goFrom','dayBack']);
                break;
            }
        }
    };

    const handleDayOff = (date) =>{
        form.setFieldValue(
            'goFrom',
            dayjs(date)
                .set('h',WORKING_TIME.START[0])
                .set('m',WORKING_TIME.START[1])
                .set('s',WORKING_TIME.START[2])
        );

        form.setFieldValue(
            'dayBack',
            dayjs(date)
            .set('h',WORKING_TIME.END[0])
            .set('m',WORKING_TIME.END[1])
            .set('s',WORKING_TIME.END[2])
        );

        form.setFieldValue('hourPerDay',[
            {
                leaveDate:dayjs(date)
                .set('h',WORKING_TIME.NEW_DAY[0])
                .set('m',WORKING_TIME.NEW_DAY[1])
                .set('s',WORKING_TIME.NEW_DAY[2]),
                totalH: LEAVE_TIME_HOUR.A_DAY,
            },
        ]);
    };

    const ChangeTime = () =>{
        if(form.getFieldValue('leaveTime') === LEAVE_TIME_HOUR.TWO_DAYS){
            if(!!form.getFieldValue('goFrom')){
                let dayApplyToDate = calDayNoWK(form.getFieldValue('goFrom'));

                form.setFieldValue(
                    'dayBack',
                    dayjs(dayApplyToDate)
                    .set('h',WORKING_TIME.END[0])
                    .set('m',WORKING_TIME.END[1])
                    .set('s',WORKING_TIME.END[2])
                );

                let hourPerDay = [
                    {
                        leaveDate: dayjs(form.getFieldValue('goFrom'))
                            .set('h',WORKING_TIME.NEW_DAY[0])
                            .set('m',WORKING_TIME.NEW_DAY[1])
                            .set('s',WORKING_TIME.NEW_DAY[2]),
                        totalH: LEAVE_TIME_HOUR.A_DAY,
                    },
                    {
                        leaveDate: dayjs(dayApplyToDate)
                            .set('h',WORKING_TIME.NEW_DAY[0])
                            .set('m',WORKING_TIME.NEW_DAY[1])
                            .set('s',WORKING_TIME.NEW_DAY[2]),
                        totalH: LEAVE_TIME_HOUR.A_DAY,  
                    },
                ];

                form.setFieldValue('hourPerDay', hourPerDay)
            }else{
                form.resetFields(['dayBack','hourPerDay']);
            }
        }else {
            if(!!form.getFieldValue('goFrom') && !!form.getFieldValue('dayBack')){
                let leaveFromDate = form.getFieldValue('goFrom');
                let leaveToDate = form.getFieldValue('dayBack');

                const{totalHours, timePerDay} = calculateDay(leaveFromDate, leaveToDate);

                if(totalHours > 0){
                    form.setFieldValue('totalHour', totalHours);
                    form.setFieldValue('hourPerDay',timePerDay);
                }
            }else {
                if(!!form.getFieldValue('totalHour')){
                    form.resetFields(['totalHour','hourPerDay']);
                }
            }
        }
    };

    const handleChangeTimePerDay = (value) => {
        if(value > 0){
            let timePerDay = form.getFieldValue('hourPerDay');
            let totalGoTime = timePerDay.reduce((acc,cur) => acc + cur.totalH, 0);
            form.setFieldValue('totalHour',totalGoTime);
        }else form.resetFields(['totalHour']);
    };

    return(
        <div>
            <Modal
                open={openForm}
                closeIcon={!confirmForm}
                okText="Đăng ký gặp khách hàng"
                cancelText="Hủy"
                cancelButtonProps={{disabled:confirmForm}}
                okButtonProps={{disabled: confirmForm}}
                centered
                onCancel={() => {
                    form.resetFields();
                    reset();
                    CancelForm();
                }}
                onOk={() => {
                    form
                        .validateFields()
                        .then(() =>{
                            setOpenConfirm(true);
                            getValue();
                        })
                        .catch((info) => {
                            console.log('Validate Failed: ',info);
                        });
                }}
                className="CustomerForm"
                {...props}
            >
                <Form
                    form={form}
                    layout='vertical'
                    name="cus_form"
                    initialValues={{
                        deptId: userInfo?.deptId ? userInfo.deptId : null,
                        userId: userInfo?.userId ? userInfo.userId : null,
                        hourPerDay:[],
                    }}
                >
                    <Form.Item
                        name="deptId"
                        label="Bộ phận/Phòng ban"
                        rules={[{
                            required: true,
                            message: 'Chon bo phan/Phong ban.',
                        },
                        ]}
                        style={{marginBottom: '16px'}}
                    >
                        <Select
                            showSearch
                            placeholder="Bộ phận/Phòng ban"
                            optionFilterProp="children"
                            notFoundContent={<p>Không có dữ liệu</p>}
                            disabled={!!userInfo?.deptId}
                        >
                            {!!userInfo?.deptId &&(
                                <Select.Option value={userInfo.deptId}>
                                    {depOption.find((item) => item.value === userInfo.deptId)?.label || ''}
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
                                message:'Vui lòng chọn tên nhân viên',
                            },
                        ]}
                        style={{marginBottom: '16px'}}
                    >
                        <Select
                            showSearch
                            placeholder="Tên nhân viên"
                            optionFilterProp="children"
                            notFoundContent={<p>Không có dữ liệu</p>}
                            disabled={!!userInfo?.fullName && !!userInfo?.userId}
                        >
                            {!!userInfo?.fullName && !!userInfo?.userId &&(
                                <Select.Option value={userInfo.userId}>
                                    {userInfo.fullName}
                                </Select.Option>
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="NoiDung"
                        label="Nội dung"
                        rules={[
                            {
                                required: true,
                                message:'Nhập nội dung trao đổi với khách hàng',
                            },
                        ]}
                        style={{marginBottom:'16px'}}
                    >
                        <Input placeholder="Nội dung trao đổi với khách hàng" type="textarea"></Input>
                    </Form.Item>
                    
                    {/* <Form.Item
                        name="goTime"
                        label="Thời gian gặp khách hàng"
                        rules={[
                            {
                                required: true,
                                message:'Chọn thời gian gặp khách hàng'
                            },
                        ]}
                        style={{marginBottom:'16px'}}
                    >
                        <Select
                            placeholder="Chọn thời gian gặp khách hàng"
                            optionFilterProp="children"
                            notFoundContent={<p>Không có dữ liệu</p>}
                            onChange={(e) => handleChange(e)}
                        >
                            {LEAVE_TIME_OPTIONS?.map((dept, index) =>{
                                return(
                                    <Select.Option key={index} value={dept.value}>
                                        {dept.label}
                                    </Select.Option>
                                );
                            })}
                        </Select>
                    </Form.Item> */}

                {/* {leaveTime === LEAVE_TIME_HOUR.A_DAY &&(
                )} */}
        {/* //////////// */}

                    {/* <Form.Item
                        name="NgayGapKhachHang"
                        label="Ngày gặp khách hàngggggggg"
                        rules={[
                            {
                                type: 'object',
                                required:true,
                                message:'Chọn ngày đi gặp khách hàng',
                            },
                            ()=>({
                                validator(_,value){
                                    if(!value || !checkWeekend(value)){
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Ngày đang chọn là cuối tuần'));
                                },
                            }),
                        ]}
                        style={{marginBottom: '16px'}}
                    >
                        <DatePicker
                            onChange={handleDayOff}
                            placeholder="Chọn ngày gặp khách hànggggg"
                            format="DD-MM-YYYY"
                            style={{
                                width: '100%',
                            }}
                        />
                    </Form.Item> */}
            {/* /////////////////// */}
                    <Form.Item
                        // hidden={isHiddenField}
                        name="goFrom"
                        label="Bắt đầu gặp khách hàng từ ngày"
                        rules={[
                            {
                                type:'object',
                                required:true,
                                message:'Chọn ngày gặp khách hàng',
                            },
                            () => ({
                                validator(_,value){
                                    if(!value || !checkWeekend(value)){
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Ngày đang chọn là cuối tuần'));
                                },
                            }),
                        ]}
                        style={{marginBottom: '16px'}}   
                    >
                        <DatePicker
                            placeholder="Chọn thời gian bắt đầu"
                            showTime={{defaultValue: dayjs('08:00', 'HH:mm')}}
                            // showTime
                            format="DD-MM-YYYY HH:mm"
                            style={{
                                width:'100%',
                            }}
                            // disabledTime={
                            //     !isOpenLeaveHourField
                            //     ? () => ({
                            //         disabledHours: () => numRange(0, 23),
                            //         disabledMinutes: () => numRange(0, 59),
                            //       })
                            //     : null
                            // }
                            onChange={ChangeTime}
                            minuteStep={5}
                            popupClassName="CFDatePick"
                        />
                    </Form.Item>

                    <Form.Item
                        // hidden={isHiddenField}
                        name="dayBack"
                        label="Kết thúc"
                        rules={[
                            {type: 'object', required: true, message: "Chọn thời gian kết thúc."},
                            ({getFieldValue}) => ({
                                validator(_,value){
                                    if(!value || getFieldValue('goFrom') < value){
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Ngày kết thúc phải lớn hơn ngày bắt đầu'));
                                },
                            }),
                            ()=>({
                                validator(_,value){
                                    if(!value || !checkWeekend(value)){
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("Ngày đang chọn là cuối tuần"));
                                },
                            }),
                        ]}
                        style={{marginBottom: '16px'}}
                    >
                        <DatePicker
                            placeholder="Chọn thời gian kết thúc"
                            showTime={{defaultValue: null}}
                            format="DD-MM-YYYY HH:mm"
                            style={{
                                width:'100%',
                            }}
                            // disabledDate={(current) => {
                            //     return(
                            //         current &&
                            //         form.getFieldValue('goFrom') &&
                            //         current > form.getFieldValue('goFrom')
                            //     );
                            // }}
                            ///////////////////////////////////////////////////////
                            // disabledTime={
                            //     !isOpenLeaveHourField
                            //     ? () => ({
                            //         disabledHours: () => numRange(0, 23),
                            //         disabledMinutes: () => numRange(0, 59),
                            //         })
                            //     : null
                            // }
                            ////////////////////////////////////////////////////////
                            // disabled={!isOpenLeaveHourField}
                            ///////////////////////////////////////////////////////
                            disabledDate={(current) => {
                            const goFromDate = form.getFieldValue('goFrom');
                            return (
                                current &&
                                goFromDate &&
                                !current.isSame(goFromDate, 'day') // Only allow the same day
                            );
                            }}
                            // disabledTime={(current) => {
                            //     const goFromDate = form.getFieldValue('goFrom');
                            //     if (!isOpenLeaveHourField || !goFromDate || !current) return {};
                            //     const goFromHour = goFromDate.hour();
                            //     const goFromMinute = goFromDate.minute();
                            //     return {
                            //       disabledHours: () => numRange(0, goFromHour),
                            //       disabledMinutes: (selectedHour) => selectedHour === goFromHour ? numRange(0, goFromMinute) : [],
                            //     };
                            //   }}
                            onChange={ChangeTime}
                            minuteStep={5}
                            popupClassName="CFDatePick"
                        />
                    </Form.Item>
                    
                    

                    {/* <Form.Item
                        //hidden={isHiddenField}
                        name="KetThuc"
                        label="Chọn ngày kết thúc"
                        rules={[
                            {type: 'object', required: true, message: 'Vui lòng chọn thời gian kết thúc'},
                            ({getFieldValue}) => ({
                              validator(_, value) {
                                if (!value || getFieldValue('goFrom') < value) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(new Error('Thời gian kết thúc phải lớn hơn bắt đầu'));
                              },
                            }),
                            () => ({
                              validator(_, value) {
                                if (!value || !checkWeekend(value)) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(new Error('Ngày đang chọn là cuối tuần!'));
                              },
                            }),
                          ]}
                          style={{marginBottom: '16px'}}
                    >
                        <DatePicker
                            placeholder="Kết thúc thời gian gặp khách hàng"
                            showTime={{defaultValue: dayjs('00:00','HH:mm')}}
                            format="DD-MM-YYYY HH:mm"
                            onChange={ChangeTime}
                            minuteStep={5}
                            popupClassName="CFDatePick"
                            disabled={!isOpenLeaveHourField}
                        />
                    </Form.Item> */}

                    <Form.Item
                        name="totalHour"
                        label="Số giờ gặp khách hàng"
                        rules={[
                            {
                                required: true,
                                message:'Nhập thời gian gặp khách hàng(số giờ)',
                            },
                        ]}
                        style={{marginBottom: '8px'}}
                    >
                        <InputNumber
                            style={{
                                width:'100%'
                            }}
                            placeholder="Tổng số giờ gặp khách hàng"
                            disabled
                        >
                        </InputNumber>
                    </Form.Item>

                    {/* {isOpenLeaveHourField && (

                    )} */}

                    <Form.Item
                        name="note"
                        label="Ghi chú"
                    >
                        <Input placeholder="Ghi chú" type="textarena"/>
                    </Form.Item>

                </Form>
                <div className="customSpaceForm"></div>
            </Modal>

            <Modal
                open={openConfirm}
                closeIcon={false}
                tittle="Xác nhận"
                okText="Nộp"
                cancelText="Hủy"
                width={300}
                centered
                onCancel={()=>
                   {setOpenConfirm(false);}
                }
                onOk={()=> {
                    setOpenConfirm(false);
                    reset();
                    CreateForm(form.getFieldsValue(true));
                    form.resetFields();
                }}
            >
                <div>
                    <div>
                        Thời gian bắt đầu:{' '}
                        <span style={{fontWeight: 500}}>
                            {!!formValues?.goFrom && formValues?.goFrom?.format('DD-MM-YYYY HH:mm')}
                        </span>
                    </div>
                    
                    <div>
                        Thời gian kết thúc:{' '}
                        <span style={{fontWeight: 500}}>
                            {!!formValues?.dayBack && formValues?.dayBack?.format('DD-MM-YYYY HH:mm')}
                        </span>
                    </div>

                    <div>
                        Nội dung:{' '}
                        <span style={{fontWeight: 500}}>
                            {!!formValues?.NoiDung && formValues?.NoiDung}
                        </span>
                    </div>

                    <div>
                        Ghi chú:{' '}
                        <span style={{fontWeight: 500}}>
                            {!!formValues?.note && formValues?.note}
                        </span>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CF;