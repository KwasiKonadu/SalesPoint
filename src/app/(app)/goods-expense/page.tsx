import GoodsExpensePage from '@/components/pages/goods-expense/goods-expense-page';
import { RoleGuard } from '@/components/auth/role-guard';

export default function Page() {
  return (
    <RoleGuard allow="admin">
      <GoodsExpensePage />
    </RoleGuard>
  );
}
