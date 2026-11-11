import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { UpdateUserDeviceTokenDto } from 'src/modules/users/dtos/req/UpdateUserDeviceToken.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUserDeviceToken(dto: UpdateUserDeviceTokenDto) {
    console.log('dto', dto);
    return this.prisma.user.update({
      where: { id: dto.id },
      data: { device_token: dto.deviceToken },
    });
  }
}
