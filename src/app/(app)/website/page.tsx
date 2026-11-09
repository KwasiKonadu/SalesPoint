import WebsitePage from '@/components/pages/website/website-page';
import { RoleGuard } from '@/components/auth/role-guard';

export default function Page() {
  return (
    <RoleGuard allow="admin">
      <WebsitePage />
    </RoleGuard>
  );
}
