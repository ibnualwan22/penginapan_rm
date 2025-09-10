import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { NextRequestWithAuth } from 'next-auth/middleware';

// Daftar rute dan izin yang dibutuhkan. Sekarang lebih detail.
const routePermissions: { path: RegExp; method: string; permission: string }[] = [
  // Halaman Frontend (GET)
  { path: /^\/admin\/rooms$/, method: 'GET', permission: 'rooms:read' },
  { path: /^\/admin\/users$/, method: 'GET', permission: 'users:read' },
  { path: /^\/admin\/roles$/, method: 'GET', permission: 'roles:read' },
  { path: /^\/admin\/laporan$/, method: 'GET', permission: 'reports:read' }, // <-- Path sudah diperbaiki
  { path: /^\/admin\/active-bookings$/, method: 'GET', permission: 'bookings:read' },
  
  // Aksi API
  { path: /^\/api\/rooms$/, method: 'POST', permission: 'rooms:create' },
  { path: /^\/api\/rooms\/.*$/, method: 'PATCH', permission: 'rooms:update' },
  { path: /^\/api\/rooms\/.*$/, method: 'DELETE', permission: 'rooms:delete' },
  
  { path: /^\/api\/bookings$/, method: 'POST', permission: 'bookings:create' },
  { path: /^\/api\/bookings\/.*$/, method: 'PATCH', permission: 'bookings:update' },

  { path: /^\/api\/roles$/, method: 'POST', permission: 'roles:create' },
  { path: /^\/api\/roles\/.*$/, method: 'PATCH', permission: 'roles:update' },

  { path: /^\/api\/users$/, method: 'POST', permission: 'users:create' },
];

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    // Fungsi ini bisa digunakan untuk logika tambahan, misalnya redirect ke halaman "Akses Ditolak"
    // req.nextauth.token berisi data sesi pengguna
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (!token) {
          return false; // Wajib login
        }

        const { pathname } = req.nextUrl;
        const userPermissions = token.permissions as string[];

        // Izinkan akses ke dashboard utama untuk semua yang sudah login
        if (pathname === '/admin') {
          return true;
        }

        // Cari aturan yang cocok dengan path dan method request
        const rule = routePermissions.find(
          (r) => r.path.test(pathname) && r.method === req.method
        );

        // Jika ada aturan yang cocok, cek izin pengguna
        if (rule) {
          return userPermissions.includes(rule.permission);
        }

        // Jika tidak ada aturan yang cocok, izinkan akses (misalnya untuk API yang tidak dilindungi)
        // PERHATIAN: Ini adalah kebijakan "default allow". Untuk keamanan lebih tinggi, bisa diubah menjadi 'false'.
        return true;
      },
    },
  }
);

// Tentukan rute mana yang ingin Anda lindungi
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/rooms/:path*',
    '/api/bookings/:path*',
    '/api/roles/:path*',
    '/api/users/:path*',
  ],
};