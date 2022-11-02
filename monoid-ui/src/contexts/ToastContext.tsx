import React from 'react';

interface ToastContextType {
  showToast: (v: {
    title: string,
    message: React.ReactNode,
    variant?: 'success' | 'danger',
    icon: (props: any) => React.ReactElement
  }) => void
}

const initValToast: ToastContextType = {
  showToast: () => {
    throw new Error('Unimplemented default');
  },
};

export default React.createContext(initValToast);
