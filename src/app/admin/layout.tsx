import Link from 'next/link';
import { LayoutDashboard, BedDouble, Users, FileText, ShieldCheck, UserCog } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import LogoutButton from '@/components/auth/LogoutButton';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  // Ambil daftar izin pengguna untuk mempermudah pengecekan
  const userPermissions = session?.user?.permissions || [];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-8">Raudlotul Muta'alimin</h1>
          <nav>
            <ul>
              {/* Dashboard selalu terlihat */}
              <li className="mb-4">
                <Link href="/admin" className="flex items-center p-2 rounded hover:bg-gray-700">
                  <LayoutDashboard className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>
              </li>

              {/* Tampilkan link jika punya izin 'rooms:read' */}
              {userPermissions.includes('rooms:read') && (
                <li className="mb-4">
                  <Link href="/admin/rooms" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <BedDouble className="h-5 w-5 mr-3" />
                    Manajemen Kamar
                  </Link>
                </li>
              )}

              {/* Tampilkan link jika punya izin 'bookings:read' */}
              {userPermissions.includes('bookings:read') && (
                <li className="mb-4">
                  <Link href="/admin/active-bookings" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Users className="h-5 w-5 mr-3" />
                    Tamu Aktif
                  </Link>
                </li>
              )}
              
              {/* Tampilkan link jika punya izin 'reports:read' */}
              {userPermissions.includes('reports:read') && (
                <li className="mb-4">
                  <Link href="/admin/laporan" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <FileText className="h-5 w-5 mr-3" />
                    Laporan
                  </Link>
                </li>
              )}

              {/* Tampilkan link jika punya izin 'roles:read' */}
              {userPermissions.includes('roles:read') && (
                <li className="mb-4">
                  <Link href="/admin/roles" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <ShieldCheck className="h-5 w-5 mr-3" />
                    Manajemen Peran
                  </Link>
                </li>
              )}

              {/* Tampilkan link jika punya izin 'users:read' */}
              {userPermissions.includes('users:read') && (
                <li className="mb-4">
                  <Link href="/admin/users" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <UserCog className="h-5 w-5 mr-3" />
                    Manajemen Pengguna
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>

        {/* Info Pengguna & Logout */}
        <div className="mt-auto p-4 border-t border-gray-700">
            <div className="mb-4">
                <p className="font-semibold text-sm truncate">{session?.user?.name}</p>
                <p className="text-xs text-gray-400">{session?.user?.role}</p>
            </div>
            <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-8 bg-gray-100 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}

