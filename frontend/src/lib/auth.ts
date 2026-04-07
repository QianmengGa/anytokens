import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// NextAuth 配置
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 调用后端登录接口
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (!res.ok || data.code !== 0) {
            return null;
          }

          // 返回用户对象 + 后端 JWT
          return {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.name,
            role: data.data.user.role,
            balance: data.data.user.balance,
            accessToken: data.data.token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    // 将后端 token 存入 NextAuth JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.balance = (user as any).balance;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    // 将信息暴露给客户端 session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).balance = token.balance;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
