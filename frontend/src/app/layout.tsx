import type { Metadata } from 'next';
import './globals.css';
import { ApolloWrapper } from '@/components/providers/ApolloWrapper';

export const metadata: Metadata = {
  title: 'FixFlow — Campus Maintenance & Asset Lifecycle Platform',
  description:
    'A centralized campus asset lifecycle, preventive maintenance, work order, and SLA management platform for educational institutions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
