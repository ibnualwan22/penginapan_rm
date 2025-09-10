'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center w-full p-2 rounded text-left text-red-400 hover:bg-red-900 hover:text-white"
    >
      <LogOut className="h-5 w-5 mr-3" />
      Logout
    </button>
  );
}