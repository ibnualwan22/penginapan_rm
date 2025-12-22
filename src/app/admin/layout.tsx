"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  BedDouble,
  Users,
  FileText,
  ShieldCheck,
  UserCog,
  DollarSign,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import LogoutButton from "@/components/auth/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen">
      {/* HAMBURGER */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* OVERLAY untuk Mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 shrink-0 bg-gray-800 text-white
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          flex flex-col
          overflow-y-auto
        `}
      >
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-8">Panel Admin</h1>

          <nav>
            <ul>
              <li className="mb-4">
                <Link href="/admin" className="flex items-center p-2 rounded hover:bg-gray-700">
                  <LayoutDashboard className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>
              </li>

              <li className="mb-4">
                <Link href="/admin/rooms" className="flex items-center p-2 rounded hover:bg-gray-700">
                  <BedDouble className="h-5 w-5 mr-3" />
                  Manajemen Kamar
                </Link>
              </li>

              <li className="mb-4">
                <Link href="/admin/prices" className="flex items-center p-2 rounded hover:bg-gray-700">
                  <DollarSign className="h-5 w-5 mr-3" />
                  Manajemen Harga
                </Link>
              </li>

              <li className="mb-4">
                <Link href="/admin/charges" className="flex items-center p-2 rounded hover:bg-gray-700">
                  <DollarSign className="h-5 w-5 mr-3" />
                  Manajemen Denda
                </Link>
              </li>

              <li className="mb-4">
                <Link href="/admin/active-bookings" className="flex items-center p-2 rounded hover:bg-gray-700">
                  <Users className="h-5 w-5 mr-3" />
                  Tamu Aktif
                </Link>
              </li>

              <li className="mb-4">
                <Link href="/admin/laporan" className="flex items-center p-2 rounded hover:bg-gray-700">
                  <FileText className="h-5 w-5 mr-3" />
                  Laporan
                </Link>
              </li>

              <li className="mb-4">
                <Link href="/admin/roles" className="flex items-center p-2 rounded hover:bg-gray-700">
                  <ShieldCheck className="h-5 w-5 mr-3" />
                  Manajemen Peran
                </Link>
              </li>

              <li className="mb-4">
                <Link href="/admin/users" className="flex items-center p-2 rounded hover:bg-gray-700">
                  <UserCog className="h-5 w-5 mr-3" />
                  Manajemen Pengguna
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-700">
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN - REMOVED overflow-x-hidden */}
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 bg-gray-100 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}