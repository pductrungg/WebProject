import {Card} from 'antd';

const SimpleCardItem = ({
  bgColor = '#ffccc7',
  title,
  totalNum,
  unit = 'ngày',
  className,
  otherprops,
}) => {
  return (
    <>
      <Card
        style={{backgroundColor: bgColor}}
        className={`text-center h-full  ${className}`}
        {...otherprops}
        bodyStyle={{height: '100%'}}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="font-semibold xl:text-xl text-lg">{title}</div>
          <div className="font-bold xl:text-5xl lg:text-3xl text-2xl">{totalNum}</div>
          <div className="xl:text-lg text-base">{unit}</div>
        </div>
      </Card>
    </>
  );
};

export {SimpleCardItem};
