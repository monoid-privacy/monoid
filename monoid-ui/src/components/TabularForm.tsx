import React from 'react';
import { classNames } from '../utils/utils';

interface TabularFormProps extends React.HTMLProps<HTMLFormElement> { }

function TabularFormComponent(props: TabularFormProps) {
  const { children, className, ...formProps } = props;
  return (
    <form className={classNames('space-y-8 divide-y divide-gray-200', className)} {...formProps}>
      {children}
    </form>
  );
}

interface TabularFormSectionProps extends React.HTMLProps<HTMLDivElement> { }

export function TabularFormSection(props: TabularFormSectionProps) {
  const { children, className, ...divProps } = props;
  return (
    <div className={classNames('space-y-6 sm:space-y-5', className)} {...divProps}>
      {children}
    </div>
  );
}

interface TabularFormBodyProps extends React.HTMLProps<HTMLDivElement> { }

export function TabularFormBody(props: TabularFormBodyProps) {
  const { children, className, ...divProps } = props;
  return (
    <div className={classNames('space-y-8 divide-y divide-gray-200 sm:space-y-5', className)} {...divProps}>
      {children}
    </div>
  );
}

interface TabularFormGroupProps extends React.HTMLProps<HTMLDivElement> { }

export function TabularFormGroup(props: TabularFormGroupProps) {
  const { children, className, ...divProps } = props;
  return (
    <div className={classNames('sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5', className)} {...divProps}>
      {children}
    </div>
  );
}

export default Object.assign(TabularFormComponent, {
  Section: TabularFormSection,
  Body: TabularFormBody,
  Group: TabularFormGroup,
});
