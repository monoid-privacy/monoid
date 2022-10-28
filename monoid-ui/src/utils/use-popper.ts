// https://github.com/tailwindlabs/headlessui/blob/main/packages/playground-react/utils/hooks/use-popper.ts

import {
  RefCallback, useRef, useCallback, useMemo,
} from 'react';
import { createPopper, Options } from '@popperjs/core';

/**
 * Example implementation to use Popper: https://popper.js.org/
 */
export default function usePopper(
  options?: Partial<Options>,
): [RefCallback<Element | null>, RefCallback<HTMLElement | null>] {
  const reference = useRef<Element | null>(null);
  const popper = useRef<HTMLElement | null>(null);

  const cleanupCallback = useRef(() => { });

  const instantiatePopper = useCallback(() => {
    if (!reference.current) return;
    if (!popper.current) return;

    if (cleanupCallback.current) cleanupCallback.current();

    cleanupCallback.current = createPopper(reference.current, popper.current, options).destroy;
  }, [reference, popper, cleanupCallback, options]);

  return useMemo(
    () => [
      (referenceDomNode) => {
        reference.current = referenceDomNode;
        instantiatePopper();
      },
      (popperDomNode) => {
        popper.current = popperDomNode;
        instantiatePopper();
      },
    ],
    [reference, popper, instantiatePopper],
  );
}
