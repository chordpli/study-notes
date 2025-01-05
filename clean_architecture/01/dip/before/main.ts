import { UserService } from "./user.service";

// Before의 경우 UserService가 직접 MySQLUserRepository를 생성하므로
// 외부에서는 그냥 UserService만 생성하면 됨
const userService = new UserService();

// 사용
const user = await userService.getUser(1); 