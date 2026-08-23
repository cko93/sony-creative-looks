import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A7C II Field Looks',
  description: 'A pocket reference for Sony a7C II creative looks, still memory slots, and movie LUTs.',
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
