import StaffPage from '@/components/pages/staff/staff-page';
import { RoleGuard } from '@/components/auth/role-guard';

export default function Page() {
  return (
    <RoleGuard allow="admin">
      <StaffPage />
    </RoleGuard>
  );
}
