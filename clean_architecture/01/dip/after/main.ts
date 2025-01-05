import { MySQLUserRepository } from "./mysql-user.repository";
import { UserService } from "./user.service";

const mysqlRepository = new MySQLUserRepository();
const userService = new UserService(mysqlRepository);

// 사용
const user = await userService.getUser(1); 