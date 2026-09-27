import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('Invalid email or password')
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated. Please contact an administrator.')
        }

        const isValidPassword = await compare(credentials.password, user.password)

        if (!isValidPassword) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string
      }
      return session
    },
  },
}

// Extend NextAuth types to include role and id
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      image?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    name: string
  }
}
