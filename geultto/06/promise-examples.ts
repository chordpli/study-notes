// 타입 정의
interface User {
    id: number;
    name: string;
    email: string;
}

interface Post {
    id: number;
    userId: number;
    title: string;
    content: string;
}

interface PostComment {
    id: number;
    postId: number;
    content: string;
}

// 가상의 데이터베이스
const usersDB: User[] = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" }
];

const postsDB: Post[] = [
    { id: 1, userId: 1, title: "First Post", content: "Hello World" },
    { id: 2, userId: 1, title: "Second Post", content: "Hello Again" }
];

const commentsDB: PostComment[] = [
    { id: 1, postId: 1, content: "Great post!" },
    { id: 2, postId: 1, content: "Thanks for sharing" }
];

// Promise를 반환하는 기본 함수들
function fetchUser(id: number): Promise<User> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = usersDB.find(user => user.id === id);
            if (user) {
                resolve(user);
            } else {
                reject(new Error(`User with id ${id} not found`));
            }
        }, 1000);
    });
}

function fetchUserPosts(userId: number): Promise<Post[]> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const posts = postsDB.filter(post => post.userId === userId);
            if (posts.length > 0) {
                resolve(posts);
            } else {
                reject(new Error(`No posts found for user ${userId}`));
            }
        }, 1000);
    });
}

function fetchPostComments(postId: number): Promise<PostComment[]> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const comments = commentsDB.filter(comment => comment.postId === postId);
            resolve(comments);
        }, 1000);
    });
}

// Promise 체이닝 예시
function getUserData(userId: number) {
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
async function getUserDataAsync(userId: number) {
    try {
        const user = await fetchUser(userId);
        const posts = await fetchUserPosts(user.id);
        const commentsPromises = posts.map(post => fetchPostComments(post.id));
        const comments = await Promise.all(commentsPromises);
        
        return {
            user,
            posts,
            comments
        };
    } catch (error) {
        console.error('Error in getUserDataAsync:', error);
        throw error;
    }
}

// 재시도 로직이 포함된 Promise 래퍼 함수
async function withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxAttempts) throw error;
            console.log(`Attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
    throw new Error('All retry attempts failed');
}

// 사용 예시
async function main() {
    try {
        // Promise 체이닝 사용
        console.log('Using Promise chaining:');
        const userData = await getUserData(1);
        console.log(userData);

        // async/await 사용
        console.log('\nUsing async/await:');
        const userDataAsync = await getUserDataAsync(1);
        console.log(userDataAsync);

        // 재시도 로직 사용
        console.log('\nUsing retry logic:');
        const userWithRetry = await withRetry(() => fetchUser(1));
        console.log(userWithRetry);

        // Promise.all 사용
        console.log('\nUsing Promise.all:');
        const [user1, user2] = await Promise.all([
            fetchUser(1),
            fetchUser(2)
        ]);
        console.log({ user1, user2 });

    } catch (error) {
        console.error('Error in main:', error);
    }
}

// 실행
main(); 