import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import crypto from 'crypto';

@Injectable()
export class PetService {
  private readonly logger = new Logger(PetService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create a passphrase for encryption
   */
  private getOrCreatePassphrase(): string {
    let passphrase = process.env.ENCRYPTION_PASSPHRASE;
    if (!passphrase) {
      passphrase = crypto.randomBytes(32).toString('hex');
      this.logger.warn(
        'Generated new encryption passphrase. Please set ENCRYPTION_PASSPHRASE in your environment variables.',
      );
    }
    return passphrase;
  }

  /**
   * Encrypt a private key
   */
  private encryptPrivateKey(privateKey: string): string {
    const passphrase = this.getOrCreatePassphrase();
    const key = crypto.createHash('sha256').update(passphrase).digest();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt a private key
   */
  private decryptPrivateKey(encryptedKey: string): string {
    const passphrase = this.getOrCreatePassphrase();
    const key = crypto.createHash('sha256').update(passphrase).digest();

    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate and store a keypair for a pet
   */
  private async generateAndStoreKeypair(petId: string): Promise<string> {
    // Generate a new keypair
    const keypair = new Ed25519Keypair();
    const privateKey = keypair.getSecretKey();
    const encryptedKey = this.encryptPrivateKey(privateKey);

    // Store in database
    await this.prisma.pet.update({
      where: { id: petId },
      data: { privateKey: encryptedKey },
    });

    return privateKey;
  }

  /**
   * Get a pet's private key, generating one if it doesn't exist
   */
  async getPetPrivateKey(petId: string): Promise<string> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      select: { privateKey: true },
    });

    if (!pet) {
      throw new Error('Pet not found');
    }

    if (!pet.privateKey) {
      return this.generateAndStoreKeypair(petId);
    }

    return this.decryptPrivateKey(pet.privateKey);
  }

  async getPet<T extends Prisma.PetInclude | undefined = undefined>(params: {
    where: Prisma.PetWhereUniqueInput;
    include?: T;
  }): Promise<Prisma.PetGetPayload<{ include: T }> | null> {
    const { where, include } = params;
    this.logger.debug(`Finding user with criteria: ${JSON.stringify(where)}`);

    try {
      const user = this.prisma.pet.findUnique({
        where,
        include,
      }) as Promise<Prisma.PetGetPayload<{ include: T }> | null>;

      if (await user) {
        this.logger.debug(`Found pet with address: ${where.walletAddress}`);
      } else {
        this.logger.debug(
          `No pet found for criteria: ${JSON.stringify(where)}`,
        );
      }

      return user;
    } catch (error) {
      this.logger.error(`Error finding pet: ${error}`);
      throw error;
    }
  }
}
