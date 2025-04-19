import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  Body,
} from '@nestjs/common';
import { PetService } from './pet.service';
import { Prisma } from '@prisma/client';

@Controller('pet')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Post()
  async createPet(@Body() petData: Prisma.PetCreateInput) {
    return this.petService.createPet(petData);
  }

  @Get(':id')
  async getPetInfo(@Param('id') id: string) {
    const petInfo = await this.petService.getPet({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!petInfo) {
      throw new NotFoundException('Pet not found');
    }

    return petInfo;
  }
}
