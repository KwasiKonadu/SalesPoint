import { redirect } from 'next/navigation';
import { DEFAULT_ROUTE } from '@/lib/nav';

export default function Home() {
  // Unauthenticated requests never reach here — middleware redirects them
  // to /login before this route runs.
  redirect(DEFAULT_ROUTE);
}
