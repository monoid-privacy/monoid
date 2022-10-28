import React, {
  useState, Fragment, useEffect, useRef,
} from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { classNames } from '../utils/utils';

export type ToastData = {
  title: string,
  message: React.ReactNode,
  variant?: 'success' | 'danger',
  id: string,
  icon: (props: any) => React.ReactElement
};

export default function Toast(props: {
  toastList: ToastData[],
  setToastList: (data: ToastData[] | ((a: ToastData[]) => ToastData[])) => void
}) {
  const [hidden, setHidden] = useState<{ [id: string]: boolean }>({});
  const hideTimers = useRef<{ [id: string]: any }>({});
  const { toastList, setToastList } = props;

  useEffect(() => {
    toastList.forEach((toast) => {
      if (!(toast.id in hideTimers)) {
        hideTimers.current = {
          ...hideTimers.current,
          [toast.id]: setTimeout(() => {
            setHidden((h) => ({
              ...h,
              [toast.id]: true,
            }));

            setTimeout(() => {
              setToastList((tl) => tl.filter((t) => t.id !== toast.id));
            }, 1000);
          }, 5000),
        };
      }
    });
  }, [toastList, setToastList]);

  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className="fixed z-[100000] inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start"
      >
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {
            toastList.map((toast, i) => (
              <Transition
                show={!hidden[toast.id]}
                appear
                as={Fragment}
                enter="transform ease-out duration-300 transition"
                enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                enterTo="translate-y-0 opacity-100 sm:translate-x-0"
                leave="transition ease-in duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                key={toast.id}
              >
                <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <toast.icon
                          className={
                            classNames('h-6 w-6', toast.variant === 'danger' ? 'text-red-500' : 'text-green-400')
                          }
                          aria-hidden="true"
                        />
                      </div>
                      <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-900">
                          {toast.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {toast.message}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex">
                        <button
                          type="button"
                          className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => {
                            setHidden({
                              ...hidden,
                              [toast.id]: true,
                            });

                            setTimeout(() => {
                              setToastList(toastList.filter((_, j) => j !== i));
                            }, 1000);
                          }}
                        >
                          <span className="sr-only">Close</span>
                          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            ))
          }
        </div>
      </div>
    </>
  );
}
