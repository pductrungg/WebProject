import {useState, useCallback, useEffect} from 'react';
import {Form, Input, Modal, DatePicker, Select, InputNumber, Col, Row} from 'antd';
import dayjs from 'dayjs';
import {LEAVE_TIME_OPTIONS, LEAVE_TIME_HOUR, GET_DAY_FUNC_TYPE, WORKING_TIME} from '../../constant';
import {getDayToCalcTime, calcLeaveHours, checkWeekend, getDataFromToken,calMeetHours} from '../../utils/helpers';
import { iteratee } from 'lodash';
import { current } from '@reduxjs/toolkit';
import axios from 'axios';
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
    const [isHiddenField, setIsHiddenField] = useState(true);
    const [formValues, setFormValues] = useState(null);
    const [isOpenLeaveHourField, setIsOpenLeaveHourField] = useState(false);
    const [endDate,setEndDay]=useState(null);
    const [startDate,setStartDay]=useState(null);
    const [timeDiff,setTimeDiff]=useState('');
    

    const reset = useCallback(() => {
        setIsHiddenField(true);
        setIsOpenLeaveHourField(false);
        setFormValues(null);
    }, []);

    const getValue = useCallback(() => {
        setFormValues(form.getFieldsValue(true));
    }, [form]);



    const start_time = (date) => {
        setStartDay(date);
        if(date){
            const EndSameDate = endDate ? date.set('h',endDate.hour()).set('m',endDate.minute()):date;
            setEndDay(EndSameDate);
            form.setFieldsValue({
                goFrom:date,
                dayBack:EndSameDate,
            });
        
        }else {
            setEndDay(null);
            form.resetFields(['dayBack']);
        }
    };

    const end_time = (date) => {
        setEndDay(date);
        form.setFieldsValue({dayBack:date});
    };

    useEffect(() => {
        if(startDate && endDate){
            const diff = endDate.diff(startDate,'minute');
            const hours = Math.round(diff/60);
            setTimeDiff(`${hours}`);
            form.setFieldsValue({totalHour: hours});
        }else{
            setTimeDiff('');
            form.setFieldsValue({totalHour: 0});
        }
    },[startDate,endDate]);


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

                    <Form.Item
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
                            onChange={start_time}
                            value={startDate}
                            minuteStep={5}
                            popupClassName="CFDatePick"
                        />
                    </Form.Item>

                    <Form.Item
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

                            disabledDate={(current) => {
                            const goFromDate = form.getFieldValue('goFrom');
                            return (
                                current &&
                                goFromDate &&
                                !current.isSame(goFromDate, 'day') // Only allow the same day
                            );
                            }}
                            onChange={end_time}
                            value={endDate}
                            minuteStep={5}
                            popupClassName="CFDatePick"
                        />
                    </Form.Item>
                    

                    <Form.Item
                        name="totalHour"
                        
                        label="Số giờ gặp khách hàng"
                        rules={[
                            {
                                required: true,
                                message:'Nhập thời gian gặp khách hàng',
                            },
                        ]}
                        style={{marginBottom: '8px'}}
                    >
                        <InputNumber
                            style={{
                                width: '100%',
                            }}
                            disabled
                        />
                    </Form.Item>

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