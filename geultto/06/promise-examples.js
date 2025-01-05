"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// 가상의 데이터베이스
const usersDB = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" }
];
const postsDB = [
    { id: 1, userId: 1, title: "First Post", content: "Hello World" },
    { id: 2, userId: 1, title: "Second Post", content: "Hello Again" }
];
const commentsDB = [
    { id: 1, postId: 1, content: "Great post!" },
    { id: 2, postId: 1, content: "Thanks for sharing" }
];
// Promise를 반환하는 기본 함수들
function fetchUser(id) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = usersDB.find(user => user.id === id);
            if (user) {
                resolve(user);
            }
            else {
                reject(new Error(`User with id ${id} not found`));
            }
        }, 1000);
    });
}
function fetchUserPosts(userId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const posts = postsDB.filter(post => post.userId === userId);
            if (posts.length > 0) {
                resolve(posts);
            }
            else {
                reject(new Error(`No posts found for user ${userId}`));
            }
        }, 1000);
    });
}
function fetchPostComments(postId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const comments = commentsDB.filter(comment => comment.postId === postId);
            resolve(comments);
        }, 1000);
    });
}
// Promise 체이닝 예시
function getUserData(userId) {
    return fetchUser(userId)
        .then(user => {
        return fetchUserPosts(user.id)
            .then(posts => {
            return {
                user,
                posts
            };
        });
    })
        .catch(error => {
        console.error('Error fetching user data:', error);
        throw error;
    });
}
// async/await 사용 예시
function getUserDataAsync(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield fetchUser(userId);
            const posts = yield fetchUserPosts(user.id);
            const commentsPromises = posts.map(post => fetchPostComments(post.id));
            const comments = yield Promise.all(commentsPromises);
            return {
                user,
                posts,
                comments
            };
        }
        catch (error) {
            console.error('Error in getUserDataAsync:', error);
            throw error;
        }
    });
}
// 재시도 로직이 포함된 Promise 래퍼 함수
function withRetry(operation_1) {
    return __awaiter(this, arguments, void 0, function* (operation, maxAttempts = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return yield operation();
            }
            catch (error) {
                if (attempt === maxAttempts)
                    throw error;
                console.log(`Attempt ${attempt} failed, retrying...`);
                yield new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
        throw new Error('All retry attempts failed');
    });
}
// 사용 예시
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Promise 체이닝 사용
            console.log('Using Promise chaining:');
            const userData = yield getUserData(1);
            console.log(userData);
            // async/await 사용
            console.log('\nUsing async/await:');
            const userDataAsync = yield getUserDataAsync(1);
            console.log(userDataAsync);
            // 재시도 로직 사용
            console.log('\nUsing retry logic:');
            const userWithRetry = yield withRetry(() => fetchUser(1));
            console.log(userWithRetry);
            // Promise.all 사용
            console.log('\nUsing Promise.all:');
            const [user1, user2] = yield Promise.all([
                fetchUser(1),
                fetchUser(2)
            ]);
            console.log({ user1, user2 });
        }
        catch (error) {
            console.error('Error in main:', error);
        }
    });
}
// 실행
main();
