import React from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { twMerge } from 'tailwind-merge';

dayjs.extend(relativeTime);

// eslint-disable-next-line import/prefer-default-export
export function classNames(...classes: (string | undefined)[]) {
  return twMerge(...classes);
}

export function timeDiffFormat(time?: string): string {
  if (!time) {
    return 'Never';
  }

  const t = dayjs(time);
  // @ts-ignore
  return dayjs().to(t);
}

export function nFormatter(num: number, digits: number) {
  if (num < 1) {
    return num.toFixed(digits).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1');
  }

  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup.slice().reverse().find((i) => num >= i.value);
  return item ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol : '0';
}

export function faComponent(icon: IconDefinition) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  const comp = (props: any) => <FontAwesomeIcon icon={icon} {...props} />;

  return comp;
}

export function min(a: number, b: number) {
  return a > b ? b : a;
}

export function max(a: number, b: number) {
  return a < b ? b : a;
}

export function dedup<T>(arr: T[], subset: (t: T) => any) {
  return Array.from(new Map(arr.map((m) => [subset(m), m])).values());
}
