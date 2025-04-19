import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PetService } from './pet.service';

@Controller('pet')
export class PetController {
  constructor(private readonly petService: PetService) {}

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
