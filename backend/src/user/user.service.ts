import { Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateUser(
    walletAddress: `0x${string}`,
    savingsGoal: string,
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { walletAddress: walletAddress },
      update: {},
      create: {
        username: `User${walletAddress}`,
        walletAddress,
        savingsGoal,
      },
    });
  }

  async getUser<T extends Prisma.UserInclude | undefined = undefined>(params: {
    where: Prisma.UserWhereUniqueInput;
    include?: T;
  }): Promise<Prisma.UserGetPayload<{ include: T }> | null> {
    const { where, include } = params;
    this.logger.debug(`Finding user with criteria: ${JSON.stringify(where)}`);

    try {
      const user = this.prisma.user.findUnique({
        where,
        include,
      }) as Promise<Prisma.UserGetPayload<{ include: T }> | null>;

      if (await user) {
        this.logger.debug(`Found user with address: ${where.walletAddress}`);
      } else {
        this.logger.debug(
          `No user found for criteria: ${JSON.stringify(where)}`,
        );
      }

      return user;
    } catch (error) {
      this.logger.error(`Error finding user: ${error}`);
      throw error;
    }
  }
}
