import SettingsPage from '@/components/pages/settings/settings-page';
import { RoleGuard } from '@/components/auth/role-guard';

export default function Page() {
  return (
    <RoleGuard allow="admin">
      <SettingsPage />
    </RoleGuard>
  );
}
