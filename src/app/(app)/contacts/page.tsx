import ContactsPage from '@/components/pages/contacts/contacts-page';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <ContactsPage initialTab={tab === 'suppliers' ? 'suppliers' : 'customers'} />;
}
