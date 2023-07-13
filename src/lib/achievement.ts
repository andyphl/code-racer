import type { Achievement as PrismaAchievement, User } from "@prisma/client";
import { prisma } from "./prisma";

type Achievement = PrismaAchievement & {
  unlockedAt: Date;
};

class Achievements {
  userId: string;
  user: User | null = null;
  achievements: Achievement[] = [];
  achievementsMap = new Map<string, Achievement>();

  constructor({ userId }: { userId: string }) {
    this.userId = userId;
  }

  async init() {
    try {
      const userRes = await prisma.user.findUnique({
        where: {
          id: this.userId,
        },
        include: {
          _count: {
            select: {
              results: true,
            },
          },
          achievements: {
            include: {
              achievement: true,
            },
          },
        },
      });

      if (!userRes) {
        throw new Error("User not found");
      }

      this.user = {
        ...userRes,
      };
      userRes.achievements.forEach((res) => {
        const achievement = {
          unlockedAt: res.unlockedAt,
          ...res.achievement,
        };
        this.achievements.push(achievement);
        this.achievementsMap.set(achievement.id, achievement);
      });
    } catch (error) {}
  }

  checkAchievementUnlocked(achievementId: string) {
    if (this.achievementsMap.get(achievementId)) {
      return true;
    }
    return false;
  }

  async unlockAchievement(achievementId: string) {
    if (this.checkAchievementUnlocked(achievementId)) {
      return;
    }
    await prisma.userAchievement.create({
      data: {
        userId: this.userId,
        achievementId,
      },
    });
  }
}
