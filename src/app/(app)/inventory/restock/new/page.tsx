import { Suspense } from 'react';

import NewRestockPage from '@/components/pages/inventory/new-restock-page';
import { RoleGuard } from '@/components/auth/role-guard';

export default function Page() {
  return (
    <RoleGuard allow="admin">
      <Suspense>
        <NewRestockPage />
      </Suspense>
    </RoleGuard>
  );
}
