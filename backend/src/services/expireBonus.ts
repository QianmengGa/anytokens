import { prisma } from '../config/database.js';

export async function expireSignupBonus(): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 找出注册超过7天、从未充值（没有 TOPUP 记录）、还有余额的用户
  const candidateUsers = await prisma.user.findMany({
    where: {
      createdAt: { lt: sevenDaysAgo },
      balance: { gt: 0 },
    },
    select: {
      id: true,
      email: true,
      balance: true,
      transactions: {
        where: {
          type: 'TOPUP',
          status: 'COMPLETED',
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  // 只处理从未充值的用户
  const expiredUsers = candidateUsers.filter(u => u.transactions.length === 0);

  console.log(`[expireBonus] 检查 ${candidateUsers.length} 个用户，${expiredUsers.length} 个需要过期`);

  for (const user of expiredUsers) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: 0 },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'BONUS',
          amount: -Number(user.balance),
          balanceBefore: user.balance,
          balanceAfter: 0,
          status: 'COMPLETED',
          paymentMethod: 'SYSTEM',
          description: '注册赠送额度 7 天已过期',
        },
      }),
    ]);
    console.log(`[expireBonus] 用户 ${user.email} 余额 $${user.balance} 已过期`);
  }
}
