import { ChevronRightIcon } from '@heroicons/react/24/solid';
import React from 'react';
import { Link } from 'react-router-dom';
import { classNames } from '../utils/utils';

interface BreadcrumbProps extends React.HTMLProps<HTMLDivElement> {
  links: {
    name: string,
    to: string,
    current?: boolean
  }[]
}

export default function Breadcrumb(props: BreadcrumbProps) {
  const { links, className } = props;
  return (
    <nav className={classNames('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-4">
        {links.map((link, i) => (
          <li key={link.name}>
            <div className="flex items-center">
              {i !== 0 && <ChevronRightIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />}
              <Link
                to={link.to}
                className={classNames('text-sm font-medium text-gray-500 hover:text-gray-700', i !== 0 ? 'ml-4' : '')}
                aria-current={link.current ? 'page' : undefined}
              >
                {link.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
