import React from 'react';

import {
  BeakerIcon, BellAlertIcon, CloudIcon, CogIcon, DocumentIcon, MagnifyingGlassIcon,
  InboxIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { faSlack, faGithub } from '@fortawesome/free-brands-svg-icons';
import Navbar from '../components/nav/Navbar';
import Sidebar from '../components/nav/Sidebar';
import { NavLink } from '../components/nav/types';
import { faComponent } from '../utils/utils';

export default function AppContainer(props: {
  children?: React.ReactNode,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const { children } = props;
  const sidebarSections: {
    key: string,
    name: string,
    links: NavLink[]
  }[] = [{
    key: 'base',
    name: '',
    links: [
      {
        title: 'Dashboard',
        icon: BeakerIcon,
        onClick: () => {
          navigate(`/workspaces/${id}/dashboard`);
        },
        current: location.pathname.startsWith(`/workspaces/${id}/dashboard`),
        key: 'dashboard',
      },
      {
        title: 'User Data Requests',
        icon: InboxIcon,
        onClick: () => {
          navigate(`/workspaces/${id}/requests`);
        },
        current: location.pathname.startsWith(`/workspaces/${id}/requests`),
        key: 'data_requests',
      },
      {
        title: 'Alerts',
        icon: BellAlertIcon,
        onClick: () => {
          navigate(`/workspaces/${id}/alerts`);
        },
        current: location.pathname.startsWith(`/workspaces/${id}/alerts`),
        key: 'alerts',
      },
    ],
  }, {
    key: 'config',
    name: 'Configuration',
    links: [
      {
        title: 'Data Silos',
        icon: CloudIcon,
        onClick: () => {
          navigate(`/workspaces/${id}/silos`);
        },
        current: location.pathname.startsWith(`/workspaces/${id}/silos`),
        key: 'data_silos',
      },
      {
        title: 'Scans',
        icon: MagnifyingGlassIcon,
        onClick: () => {
          navigate(`/workspaces/${id}/scans`);
        },
        current: location.pathname.startsWith(`/workspaces/${id}/scans`),
        key: 'alerts',
      },
      {
        title: 'Identifiers',
        icon: IdentificationIcon,
        onClick: () => {
          navigate(`/workspaces/${id}/identifiers`);
        },
        current: location.pathname.startsWith(`/workspaces/${id}/identifiers`),
        key: 'identifiers',
      },
      {
        title: 'Settings',
        icon: CogIcon,
        onClick: () => {
          navigate(`/workspaces/${id}/settings`);
        },
        current: location.pathname.startsWith(`/workspaces/${id}/settings`),
        key: 'settings',
      },
    ],
  }, {
    key: 'help',
    name: 'Help',
    links: [
      {
        title: 'Documentation',
        icon: DocumentIcon,
        onClick: () => {
          window.open('https://docs.monoid.co', '_blank');
        },
        current: false,
        key: 'docs',
      },
      {
        title: 'Community',
        icon: faComponent(faSlack),
        onClick: () => {
          window.location.href = 'mailto:vignesh@brist.ai?subject=Feature Request';
        },
        current: false,
        key: 'community',
      },
      {
        title: 'Issues/Feature Requests',
        icon: faComponent(faGithub),
        onClick: () => {
          window.location.href = 'mailto:vignesh@brist.ai';
        },
        current: false,
        key: 'issues',
      },
    ],
  }];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <Navbar
        links={[]}
        dropdownLinks={[]}
        showDropdown={false}
        hiddenLinks={sidebarSections.map((l) => l.links).flat()}
      />
      <div className="flex items-top flex-grow">
        <Sidebar
          sections={sidebarSections}
        />
        <div className="flex-grow bg-gray-100 min-w-0">
          <main>
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

AppContainer.defaultProps = {
  children: undefined,
};
