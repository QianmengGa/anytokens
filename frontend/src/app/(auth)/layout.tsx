import { PublicNavbar } from '@/components/layout/PublicNavbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      {children}
    </>
  );
}
