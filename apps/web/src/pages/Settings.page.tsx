import { Page } from '../components/Page.component';
import { PageAlert } from '../types/components';

export function Settings() {
  // Build alerts array
  const alerts: PageAlert[] = [
    {
      id: 'under-construction',
      severity: 'info',
      message: 'Settings page is under construction. Configuration options will be added here.',
    },
  ];

  return (
    <Page
      title="Settings"
      subtitle="Configure your application preferences and account settings"
      alerts={alerts}
      meta={{
        title: 'Settings - Ultiverse League',
        description: 'Configure your league management preferences and account settings',
      }}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Settings' },
      ]}
    />
  );
}