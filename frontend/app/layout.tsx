// 'use client';

// import type React from 'react';
// import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
// import './globals.css';
// import { ThemeProvider } from '@/components/theme-provider';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { useState } from 'react';

// const inter = Inter({ subsets: ['latin'] });

// export const metadata: Metadata = {
//   title: 'ModernPexels',
//   description: 'A modern and intuitive image discovery platform',
//   generator: 'v0.dev'
// };

// export default function RootLayout({
//   children
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   const [queryClient] = useState(() => new QueryClient());
//   return (
//     <html lang='en'>
//       <body className={inter.className}>
//         <QueryClientProvider client={queryClient}>
//           <ThemeProvider
//             attribute='class'
//             defaultTheme='system'
//             enableSystem
//             disableTransitionOnChange
//           >
//             {children}
//           </ThemeProvider>
//         </QueryClientProvider>
//       </body>
//     </html>
//   );
// }

import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/components/provider'; // Client Component provider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ModernPexels',
  description: 'A modern and intuitive image discovery platform',
  generator: 'v0.dev'
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
