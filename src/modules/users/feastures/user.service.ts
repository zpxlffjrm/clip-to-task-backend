import { Injectable } from '@nestjs/common';
import { UpdateUserDeviceTokenDto } from 'src/modules/users/dtos/req/UpdateUserDeviceToken.dto';
import { UserRepository } from 'src/modules/users/feastures/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUser(id: string) {
    return this.userRepository.getUser(id);
  }

  async updateUserDeviceToken(dto: UpdateUserDeviceTokenDto) {
    return this.userRepository.updateUserDeviceToken(dto);
  }
}
