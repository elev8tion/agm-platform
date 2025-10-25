import '@/app/globals.css';
import { ReactNode } from 'react';
import { ModelProvider } from '@/components/model-context';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <ModelProvider>{children}</ModelProvider>
      </body>
    </html>
  );
}
