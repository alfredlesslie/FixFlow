import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ApolloWrapper } from '@/components/providers/ApolloWrapper';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FixFlow — Campus Operations & Maintenance Intelligence',
  description:
    'High-reliability campus asset lifecycle, real-time maintenance reporting, automated duplicate triage, and SLA resolution platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sansFont.variable} ${monoFont.variable}`}>
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
