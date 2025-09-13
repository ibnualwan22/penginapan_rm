import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { 
            role: {
              include: {
                permissions: { include: { permission: true } }
              }
            },
            // Sertakan properti yang dikelola pengguna
            properties: {
              include: {
                property: true
              }
            }
          }
        });

        if (user && user.role && bcrypt.compareSync(credentials.password, user.password)) {
          const permissions = user.role.permissions.map(p => p.permission.name);
          // Ambil daftar properti yang dikelola
          const managedProperties = user.properties.map(up => ({
            id: up.property.id,
            name: up.property.name,
          }));
          
          return {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role.name,
            permissions: permissions,
            managedProperties: managedProperties, // <-- Tambahkan ke data user
          };
        }
        
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
        token.managedProperties = user.managedProperties; // <-- Tambahkan ke token
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.permissions = token.permissions;
      session.user.managedProperties = token.managedProperties; // <-- Tambahkan ke sesi
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };