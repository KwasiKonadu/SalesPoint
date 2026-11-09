import SupplierProfilePage from '@/components/pages/suppliers/supplier-profile-page';
import { RoleGuard } from '@/components/auth/role-guard';

export default function Page() {
  return (
    <RoleGuard allow="admin">
      <SupplierProfilePage />
    </RoleGuard>
  );
}
