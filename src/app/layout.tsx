import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Vacuum Algorithm Lab | Interactive Simulation Platform',
  description: 'Interactive algorithm simulation, comparison and evaluation platform for autonomous vacuum robots. Explore A*, DWA, SLAM, coverage planning and more.',
  keywords: 'robotics, algorithm simulation, vacuum robot, A*, SLAM, coverage planning, path planning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#070d1f] text-slate-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}
