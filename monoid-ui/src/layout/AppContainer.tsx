import React, { useContext } from 'react';

import {
  BeakerIcon, BellAlertIcon, CloudIcon, CogIcon, DocumentIcon, MagnifyingGlassIcon,
  InboxIcon,
  IdentificationIcon,
  CircleStackIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { faSlack, faGithub } from '@fortawesome/free-brands-svg-icons';
import Navbar from '../components/nav/Navbar';
import Sidebar from '../components/nav/Sidebar';
import { NavLink } from '../components/nav/types';
import { faComponent } from '../utils/utils';
import WorkspaceContext from '../contexts/WorkspaceContext';

export default function AppContainer(props: {
  children?: React.ReactNode,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { workspace } = useContext(WorkspaceContext);

  const { children } = props;
  type SidebarSection = {
    key: string,
    name: string,
    links: NavLink[]
  };

  const sidebarSections: SidebarSection[] = [
    workspace && !workspace.onboardingComplete
    && {
      key: 'onboarding',
      name: '',
      links: [
        {
          title: 'Onboarding',
          icon: BookOpenIcon,
          onClick: () => {
            navigate(`/workspaces/${id}/onboarding`);
          },
          current: location.pathname.startsWith(`/workspaces/${id}/onboarding`),
          key: 'onboarding',
        },
      ],
    },
    {
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
          title: 'Data Map',
          icon: CircleStackIcon,
          onClick: () => {
            navigate(`/workspaces/${id}/data_map`);
          },
          current: location.pathname.startsWith(`/workspaces/${id}/data_map`),
          key: 'data_map',
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
            window.open(
              'https://join.slack.com/t/monoidworkspace/shared_invite/zt-1jvlndiw6-l9~KhMXhG35OOgRqFGXnGg',
              '_blank',
            );
          },
          current: false,
          key: 'community',
        },
        {
          title: 'Issues/Feature Requests',
          icon: faComponent(faGithub),
          onClick: () => {
            window.open(
              'https://github.com/monoid-privacy/monoid/issues',
              '_blank',
            );
          },
          current: false,
          key: 'issues',
        },
      ],
    }].filter(Boolean) as SidebarSection[];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <Navbar
        links={[]}
        dropdownLinks={[]}
        showDropdown={false}
        hiddenLinks={sidebarSections.map((l) => l.links).flat()}
      />
      <div>
        <Sidebar
          sections={sidebarSections}
        />
        <div className="w-full md:pl-64 pt-16">
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
