import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { FeatureProvider } from '@/contexts/feature-context';
import { LocaleProvider } from '@/contexts/locale-context';
import { ThemeProvider } from '@/components/common/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HRPlatform CRM',
  description: 'Enterprise CRM/HCM Platform'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <FeatureProvider>
                <ToastProvider>{children}</ToastProvider>
              </FeatureProvider>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
