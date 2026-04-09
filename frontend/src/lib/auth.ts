import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import DiscordProvider from 'next-auth/providers/discord';

// NextAuth 配置
export const authOptions: NextAuthOptions = {
  providers: [
    // 邮箱 + 密码登录
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

    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),

    // GitHub OAuth
    ...(process.env.GITHUB_CLIENT_ID
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          }),
        ]
      : []),

    // Discord OAuth
    ...(process.env.DISCORD_CLIENT_ID
      ? [
          DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    // signIn 回调：OAuth 登录时调用后端创建/获取用户
    async signIn({ user, account }) {
      if (account?.provider && account.provider !== 'credentials') {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              provider: account.provider,
            }),
          });
          const data = await res.json();
          if (res.ok && data.code === 0) {
            // 将后端返回的数据附加到 user 对象
            (user as any).id = data.data.user.id;
            (user as any).role = data.data.user.role;
            (user as any).balance = data.data.user.balance;
            (user as any).accessToken = data.data.token;
          } else {
            return false;
          }
        } catch {
          return false;
        }
      }
      return true;
    },

    // 将后端 token 存入 NextAuth JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.balance = (user as any).balance;
        token.accessToken = (user as any).accessToken;
      }

      // 每次 token 刷新时从后端同步最新用户信息（角色、余额等）
      if (token.accessToken) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token.accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.code === 0 && data.data) {
              token.role = data.data.role;
              token.balance = data.data.balance;
            }
          }
        } catch {
          // 网络错误时保留旧值
        }
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
