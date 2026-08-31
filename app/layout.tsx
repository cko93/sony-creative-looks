import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A7C II Field Looks',
  description: 'An audited pocket reference for Sony a7C II Picture Profile translations, published Fujifilm targets, memory slots, and movie LUTs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
