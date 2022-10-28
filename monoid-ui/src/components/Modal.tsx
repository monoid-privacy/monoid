import { Transition, Dialog } from '@headlessui/react';
import React, { Fragment } from 'react';
import { classNames } from '../utils/utils';

function Modal(props: {
  open: boolean,
  setOpen: (o: boolean) => void,
  children: React.ReactNode
}) {
  const { open, setOpen, children } = props;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end sm:items-center justify-center
            min-h-full p-4 text-center sm:p-0"
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative bg-white rounded-lg px-4 pt-5 pb-4
                text-left overflow-hidden shadow-xl transform transition-all sm:my-8
                sm:max-w-xl sm:w-full sm:p-6"
              >
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

interface ModalImageComponentProps extends React.HTMLProps<HTMLDivElement> { }

export function ModalImageComponent(props: ModalImageComponentProps) {
  const { children, className, ...divProps } = props;
  return (
    <div
      className={
        classNames(
          'mx-auto flex h-12 w-12 flex-shrink-0 items-center',
          'justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10',
          className,
        )
      }
      {...divProps}
    >
      {children}
    </div>
  );
}

interface ModalFooterComponentProps extends React.HTMLProps<HTMLDivElement> { }

export function ModalFooterComponent(props: ModalFooterComponentProps) {
  const { children, className, ...divProps } = props;
  return (
    <div
      className={
        classNames(
          'mt-5 sm:mt-4 sm:flex sm:flex-row-reverse',
          className,
        )
      }
      {...divProps}
    >
      {children}
    </div>
  );
}

interface ModalBodyComponentProps extends React.HTMLProps<HTMLDivElement> { }

export function ModalBodyComponent(props: ModalBodyComponentProps) {
  const { children, className, ...divProps } = props;
  return (
    <div
      className={
        classNames(
          'mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left',
          className,
        )
      }
      {...divProps}
    >
      {children}
    </div>
  );
}

export default Object.assign(Modal, {
  Image: ModalImageComponent,
  Footer: ModalFooterComponent,
  Body: ModalBodyComponent,
});
