import { UserRepository } from './user.repository.interface';
import { User } from './user.interface';

export class MySQLUserRepository implements UserRepository {
  async findById(id: number): Promise<User> {
    // MySQL 데이터베이스 연결 및 쿼리 로직
    return {
      id,
      name: `사용자${id}`,
      email: `user${id}@example.com`
    };
  }
} 