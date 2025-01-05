import { User } from './user.interface';
import { UserRepository } from './user.repository.interface';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUser(id: number): Promise<User> {
    return this.userRepository.findById(id);
  }
} 