import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Control Dashboard | Soundkish',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#08080b] text-[#f5f5f7]">{children}</div>;
}
