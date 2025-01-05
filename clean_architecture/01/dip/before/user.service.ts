import { MySQLUserRepository } from "./mysql-user.repository";
import { User } from "./user.interface";

export class UserService {
  private userRepository: MySQLUserRepository;

  constructor() {
    this.userRepository = new MySQLUserRepository();
  }

  async getUser(id: number): Promise<User> {
    return this.userRepository.findById(id);
  }
} 