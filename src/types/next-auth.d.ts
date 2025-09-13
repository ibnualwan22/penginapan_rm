import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

// Menambahkan tipe untuk properti yang dikelola
type ManagedProperty = {
  id: string;
  name: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      permissions: string[];
      managedProperties: ManagedProperty[]; // <-- Tambahan
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string;
    permissions: string[];
    managedProperties: ManagedProperty[]; // <-- Tambahan
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: string[];
    managedProperties: ManagedProperty[]; // <-- Tambahan
  }
}
