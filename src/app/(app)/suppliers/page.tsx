import SuppliersPage from '@/components/pages/suppliers/suppliers-page';
import { RoleGuard } from '@/components/auth/role-guard';

export default function Page() {
  return (
    <RoleGuard allow="admin">
      <SuppliersPage />
    </RoleGuard>
  );
}
