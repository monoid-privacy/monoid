import React, { useEffect, useState } from 'react';
// @ts-ignore
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
// import Input from './Input';
import { classNames } from '../utils/utils';
import 'react-datepicker/dist/react-datepicker.css';
import Input from './Input';

interface DateRangePickerProps extends Omit<React.HTMLProps<HTMLDivElement>, 'onChange'> {
  range: { from: dayjs.Dayjs, to: dayjs.Dayjs },
  onChange: (r: { from: dayjs.Dayjs, to: dayjs.Dayjs }) => void
}

export default function DateRangePicker(props: DateRangePickerProps) {
  const { range, onChange, className } = props;
  //   const [focus, setFocus] = useState<'f' | 't'>('f');

  //   const ref = useRef<HTMLDivElement>(null);
  //   const picker = useRef<DatePicker>(null);
  //   const fromPicker = useRef<HTMLInputElement>(null);
  //   const toPicker = useRef<HTMLInputElement>(null);

  const { from, to } = range;
  const [tempRange, setTempRange] = useState<[Date | null, Date | null]>([null, null]);
  const [tf, tt] = tempRange;

  useEffect(() => {
    setTempRange([from.toDate(), to.toDate()]);
  }, [from, to]);

  //   useEffect(() => {
  //     console.log('use effect', fromPicker.current, toPicker.current, focus);
  //     if (fromPicker.current && focus === 'f') {
  //       console.log('focusing');
  //       fromPicker.current.focus();
  //     }

  //     if (toPicker.current && focus === 't') {
  //       toPicker.current.focus();
  //     }
  //   }, [fromPicker, toPicker, focus]);

  //   console.log(fromPicker.current);

  return (
    <div className={classNames('flex flex-col', className)}>
      <div className="flex space-x-2 mb-4">
        <Input
          value={tf ? dayjs(tf).format('MM/DD/YY') : ''}
          readOnly
          placeholder="From"
        />
        <Input
          value={tt ? dayjs(tt).format('MM/DD/YY') : ''}
          placeholder="To"
        />
      </div>
      <div className="flex w-full justify-center">
        <DatePicker
          onChange={([f, t]) => {
            setTempRange([f, t]);
            if (f != null && t != null) {
              onChange({ from: dayjs(f), to: dayjs(t) });
            }
          }}
          startDate={tf}
          endDate={tt}
          selected={tf}
          selectsRange
          inline
        />
      </div>
    </div>
  );
}
