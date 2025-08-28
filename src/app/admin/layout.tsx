import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-8">Penginapan RM</h1>
        <nav>
          <ul>
            <li className="mb-4">
              <Link href="/admin" className="block p-2 rounded hover:bg-gray-700">
                Dashboard
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/admin/rooms" className="block p-2 rounded hover:bg-gray-700">
                Manajemen Kamar
              </Link>
            </li>
            <li className="mb-4">
      <Link href="/admin/laporan" className="block p-2 rounded hover:bg-gray-700">
        Laporan
      </Link>
    </li>
          </ul>
        </nav>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 p-8 bg-gray-100 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}