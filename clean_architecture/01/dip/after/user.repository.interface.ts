import { User } from './user.interface';

export interface UserRepository {
  findById(id: number): Promise<User>;
} 