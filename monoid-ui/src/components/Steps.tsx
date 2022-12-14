/* eslint-disable no-nested-ternary */
import React from 'react';
import { CheckIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { classNames } from '../utils/utils';

export type Step = {
  id: string,
  name: string,
  status: 'complete' | 'upcoming' | 'current' | 'failed' | 'warn',
  description: string,
};

export function SimpleStepView(props: { steps: Step[] }) {
  const { steps } = props;

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={classNames(stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '', 'relative')}>
            {step.status === 'complete' ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-indigo-600" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-900"
                >
                  <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            ) : step.status === 'current' ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function StepView(props: { steps: Step[] }) {
  const { steps } = props;

  return (
    <nav aria-label="Progress" className="my-8">
      <ol className="divide-y divide-gray-300 rounded-md bg-white border border-gray-300 md:flex md:divide-y-0">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className="relative md:flex md:flex-1">
            {step.status === 'complete' ? (
              <div className="group flex w-full items-center">
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                    <CheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                  <span className="mt-0.5 ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-gray-900">{step.name}</span>
                    <span className="text-xs font-light text-gray-500">{step.description}</span>
                  </span>
                </span>
              </div>
            ) : step.status === 'failed' ? (
              <div className="group flex w-full items-center">
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-600 group-hover:bg-red-800">
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                  <span className="mt-0.5 ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-gray-900">{step.name}</span>
                    <span className="text-xs font-light text-gray-500">{step.description}</span>
                  </span>
                </span>
              </div>
            ) : step.status === 'warn' ? (
              <div className="group flex w-full items-center">
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-600 group-hover:bg-yellow-800">
                    <ExclamationTriangleIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                  <span className="mt-0.5 ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-gray-900">{step.name}</span>
                    <span className="text-xs font-light text-gray-500">{step.description}</span>
                  </span>
                </span>
              </div>
            ) : step.status === 'current' ? (
              <div className="flex items-center px-6 py-4 text-sm font-medium" aria-current="step">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
                  <span className="text-indigo-600">{step.id}</span>
                </span>
                <span className="mt-0.5 ml-4 flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-gray-900">{step.name}</span>
                  <span className="text-xs font-light text-gray-500">{step.description}</span>
                </span>
              </div>
            ) : (
              <div className="group flex items-center">
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                    <span className="text-gray-500 group-hover:text-gray-900">{step.id}</span>
                  </span>
                  <span className="mt-0.5 ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-gray-900">{step.name}</span>
                    <span className="text-xs font-light text-gray-500">{step.description}</span>
                  </span>
                </span>
              </div>
            )}

            {stepIdx !== steps.length - 1 ? (
              <>
                {/* Arrow separator for lg screens and up */}
                <div className="absolute top-0 right-0 hidden h-full w-5 md:block" aria-hidden="true">
                  <svg
                    className="h-full w-full text-gray-300"
                    viewBox="0 0 22 80"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 -2L20 40L0 82"
                      vectorEffect="non-scaling-stroke"
                      stroke="currentcolor"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
