
import "./globals.css";
import AuthProvider from '@/components/auth/AuthProvider'; // Buat file ini


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
