// src/app/layout.tsx
import type { Metadata } from 'next';
import { Boogaloo, Nunito } from 'next/font/google';
import './globals.css';

const boogaloo = Boogaloo({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Herts Quest 🗺️',
  description: 'The University of Hertfordshire Treasure Hunt',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${boogaloo.variable} ${nunito.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
