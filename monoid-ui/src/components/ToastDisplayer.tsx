import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ToastContext from '../contexts/ToastContext';
import Toast, { ToastData } from './Toast';

export default function ToastDisplayer(props: { children: React.ReactNode }) {
  const [toastList, setToastList] = useState<ToastData[]>([]);
  const { children } = props;

  const toastCtxVal = useMemo(() => ({
    showToast: (message: {
      title: string,
      message: React.ReactNode,
      variant?: 'success' | 'danger',
      icon: (props: any) => React.ReactElement
    }) => {
      setToastList([
        ...toastList,
        {
          ...message,
          id: uuidv4(),
        },
      ]);
    },
  }), []);

  return (
    <ToastContext.Provider
      value={toastCtxVal}
    >
      {children}
      <Toast toastList={toastList} setToastList={setToastList} />
    </ToastContext.Provider>
  );
}
