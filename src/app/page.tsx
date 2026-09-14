import { redirect } from 'next/navigation';
import { DEFAULT_ROUTE } from '@/lib/nav';

export default function Home() {
  redirect(DEFAULT_ROUTE);
}
