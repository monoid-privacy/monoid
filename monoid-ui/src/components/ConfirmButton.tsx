import { Dialog } from '@headlessui/react';
import React, { useState } from 'react';
import { classNames } from 'utils/utils';
import Button, { ButtonVariant } from './Button';
import Modal, { ModalBodyComponent, ModalFooterComponent } from './Modal';
import Spinner from './Spinner';
import Text from './Text';

export default function ConfirmButton(props: {
  dialogTitle: string,
  dialogBody: string,
  onConfirm: (close: () => void) => void,
  className?: string,
  variant?: ButtonVariant,
  children?: React.ReactNode,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    dialogTitle, dialogBody, onConfirm, className, variant,
    children,
  } = props;

  return (
    <>
      <Modal open={modalOpen} setOpen={setModalOpen}>
        <ModalBodyComponent>
          <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
            {dialogTitle}
          </Dialog.Title>
          <div className="mt-2">
            <Text size="sm" em="light">
              {dialogBody}
            </Text>
          </div>
        </ModalBodyComponent>
        <ModalFooterComponent>
          <div className="flex space-x-2">
            <Button onClick={() => {
              setLoading(true);
              onConfirm(() => {
                setLoading(false);
                setModalOpen(false);
              });
            }}
            >
              {loading ? <Spinner /> : 'Continue'}
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </ModalFooterComponent>
      </Modal>

      <Button
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        variant={variant}
        className={classNames('ml-auto px-2', className)}
      >
        {children}
      </Button>
    </>
  );
}

ConfirmButton.defaultProps = {
  className: '',
  variant: undefined,
  children: undefined,
};
