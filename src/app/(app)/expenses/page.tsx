import ExpensesPage from '@/components/pages/expenses/expenses-page';
import { RoleGuard } from '@/components/auth/role-guard';

export default function Page() {
  return (
    <RoleGuard allow="admin">
      <ExpensesPage />
    </RoleGuard>
  );
}
