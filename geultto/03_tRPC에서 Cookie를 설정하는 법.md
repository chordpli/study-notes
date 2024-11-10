
# tRPC에서 Cookie를 설정하는 법

## tRPC에서 Cookie를 설정하게 된 배경
최근 회사 서비스에서 국제화(i18n) 기능을 추가하게 되었다. 
서버 사이드에서 언어를 처리하기로 협의되었고, 이를 위해 서버 단에서 Redux를 사용하여 언어에 맞는 번역 데이터를 제공하는 방법을 선택하였다. 
이때, 서버는 사용자가 어떤 언어를 사용하고 있는지 알아야 하기 때문에, 사용자의 언어를 판단하는 과정을 고민하게 되었다.

### 사용자 언어 판단 방법
먼저, 로그인한 유저인지 아닌지를 판단하기로 했다.
로그인한 유저라면, 유저 DB에 존재하는 locale 정보를 가져와 언어를 판단하기로 했다.

로그인하지 않은 유저를 위해서는 다양한 방법을 준비했다.
이미 우리 서비스를 사용한 유저일 수 있으므로, 저장된 쿠키를 확인하기로 했다.
쿠키가 존재하지 않는다면, HTTP 헤더에 담긴 Accept-Language 정보를 통해 언어를 판단하기로 했다.
Accept-Language 헤더가 존재하지 않는다면, 기본 언어('en')를 설정하기로 했다.

정리하면,
1. 로그인한 유저라면 DB의 locale 정보를 확인한다.
2. 로그인하지 않은 유저라면 저장된 쿠키를 확인한다.
3. 쿠키가 존재하지 않는다면 Accept-Language 헤더를 확인한다.
4. Accept-Language 헤더가 없다면 기본 언어('en')를 설정한다.

새로운 언어를 선택하게 될 때는 DB와 쿠키에 언어 설정을 저장하는 과정이 필요하다. 
이를 위해 현재 구성 중인 tRPC를 통해 언어를 선택하는 기능을 추가해야 한다.

로그인 서비스는 Supabase를 사용하고 있기 때문에, Supabase에서 제공하는 함수를 통해 유저 정보를 가져오고, 이를 통해 언어를 설정하는 과정을 추가하였다.
그러나 쿠키는 직접 설정해줘야 하기 때문에, 이를 위한 추가 작업이 필요했다.

#### Cookie란?
쿠키는 웹 서버가 클라이언트에 저장하도록 하는 작은 데이터 조각이며, 세션 관리, 사용자 선호도 저장, 트래킹 등의 목적으로 사용된다.
또한 HttpOnly, Secure, SameSite 속성을 가지고 있어서 보안적인 측면을 고려할 수 있다.

##### Cookie 속성들
- HttpOnly: JavaScript를 통한 접근을 방지하여 XSS 공격으로부터 보호
- Secure: HTTPS 프로토콜에서만 쿠키 전송 허용
- SameSite: CSRF 공격 방지를 위한 쿠키의 전송 제한
  - Strict: 같은 도메인에서만 쿠키 전송
  - Lax: 일부 크로스 사이트 요청에서도 쿠키 전송 허용
  - None: 모든 크로스 사이트 요청에서 쿠키 전송 (Secure 필수)

#### Accept-Language란?
Accept-Language는 사용자의 언어 선호를 나타내는 HTTP 헤더로, 사용자가 선호하는 언어를 서버에 알려주는 역할을 한다.
```
Accept-Language: en-US, en;q=0.9, ko;q=0.8
```
이 헤더는 사용자가 영어(en-US, en)를 가장 선호하고, 그 다음으로 한국어(ko)를 선호하지만 영어보다 우선순위가 낮다는 것을 의미한다.


## tRPC에서 Cookie를 설정하는 방법

### Context 설정

쿠키를 설정하기 위해서는 tRPC의 컨텍스트(Context)에 res 객체를 포함시켜야 한다.  
이를 통해 서버에서 클라이언트로 응답을 보낼 때 Set-Cookie 헤더를 설정할 수 있다.

```ts
import type * as trpcNext from '@trpc/server/adapters/next'
import { createApiClient } from '~/utils/supabase'

interface CreateContextOptions {
  // 추가적인 컨텍스트 옵션들...
  res: trpcNext.NextApiResponse
}

export async function createContextInner(opts: CreateContextOptions) {
  return opts
}

export type Context = Awaited<ReturnType<typeof createContextInner>>

export async function createContext(opts: trpcNext.CreateNextContextOptions): Promise<Context> {
  return await createContextInner({
    // 추가적인 컨텍스트 옵션들...
    res: opts.res,
  })
}
```

### tRPC Client 설정
tRPC Client에서는 기본적으로 쿠키를 설정하기 위해 `credentials: 'include'` 옵션을 추가해줘야 한다.  
사실 여기 부분에서 조금 많이 고민을 했던 부분이 있다.

tRPC의 문서를 찾아보게 되면, 두 가지 설정 방법이 존재하는 것을 알 수 있다.  
둘 모두 httpBatchLink를 사용하는 방법이지만, 차이점이 있다.  
먼저, httpBatchLink Options에 무엇이 있는지 확인해보자.

```ts
export interface HTTPBatchLinkOptions extends HTTPLinkOptions {
  maxURLLength?: number;
}
export interface HTTPLinkOptions {
  url: string;
  /**
   * Add ponyfill for fetch
   */
  fetch?: typeof fetch;
  /**
   * Add ponyfill for AbortController
   */
  AbortController?: typeof AbortController | null;
  /**
   * Data transformer
   * @see https://trpc.io/docs/data-transformers
   **/
  transformer?: DataTransformerOptions;
  /**
   * Headers to be set on outgoing requests or a callback that of said headers
   * @see http://trpc.io/docs/header
   */
  headers?:
    | HTTPHeaders
    | ((opts: { opList: Operation[] }) => HTTPHeaders | Promise<HTTPHeaders>);
}
```

위 코드에서 우리가 확인하고, 사용할 부분은 `fetch`와 `headers`이다.

1. Headers
httpBatchLink의 `headers` 옵션을 통해 쿠키를 설정할 수 있다.

```ts
export const trpcVanilla = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      ...
      headers: () => {
        const cookie = document.cookie
        return {
          Cookie: cookie,
        }
      },
    }),
  ],
})
```
document.cookie를 통해 넘어온 쿠키들을 모두 유지하고, 새롭게 설정된 쿠키를 추가할 수 있다.  
하지만 HttpOnly 쿠키에 접근할 수 없다.
만약, 고정된 쿠키를 설정하려면 아래와 같은 방법을 사용할 수 있다.

```ts
headers: {
  Cookie: 'key=value; key2=value2',
},
```

하지만 이 방법은 보안상의 이유로 권장되지 않는다.
document.cookie로는 HttpOnly 쿠키에 접근할 수 없고, 클라이언트 측에서 Cookie 헤더를 수동으로 설정하는 것은 브라우저의 보안 정책에 의해 제한될 수 있다.


2. Fetch (Send cookies cross-origin)
httpBatchLink의 `fetch` 옵션을 통해 쿠키를 설정할 수 있다.

```ts
export const trpcVanilla = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        })
      },
     ...
    }),
  ],
})
```

credentials: 'include'를 설정하면 브라우저가 쿠키를 자동으로 요청에 포함한다. 
이는 HttpOnly 쿠키도 포함되므로 인증과 세션 관리에 필요한 모든 쿠키를 전송할 수 있다.

credentials을 설정하지 않을 경우 기본 값은 `same-origin`이다.  
따라서 동일 출처에만 동작한다면 따로 설정하지 않아도 된다.

`include`를 사용하면 동일 출처(same-origin)뿐만 아니라 교차 출처(cross-origin) 요청에서도 쿠키가 포함된다.

동일 출처에서만 동작한다면 `same-origin`을 사용하면 되지만, 추후 교차 출처 요청으로 변경될 가능성을 고려하여 credentials: 'include'를 설정하는 것이 좋다.

#### 어떤 방법을 사용할 것인가?
두 가지 방법 모두 사용할 수 있지만, 권장되는 방법은 `fetch` 옵션을 사용하는 방법이다.
여기서부터는 tRPC 문서가 아니라 MDN에서 제공하는 문서를 참고하였다.

쉽게 말해, 우리가 credentials: 'include'를 사용하는 것은 마치 부모님께 중요한 일을 맡기는 것과 같다.

아이에게 복잡하고 위험한 일을 직접 시키면 실수나 사고가 날 수 있다. 대신에 부모님께서 그 일을 처리해 주시면 더 안전하고 효율적이다. 마찬가지로, 브라우저에게 쿠키 관리와 보안을 맡기면 우리가 직접 복잡한 보안 사항을 처리하지 않아도 안전하게 동작할 수 있다.

credentials: 'include'를 사용하면 브라우저는 HttpOnly 쿠키를 포함하여 모든 중요한 쿠키를 자동으로 요청에 포함시키고, 보안 정책을 준수하며 쿠키를 안전하게 전송한다.
document.cookie를 통한 수동 설정을 하게 되면, 클라이언트 측 스크립트는 HttpOnly 쿠키에 접근할 수 없다. 즉, 중요한 쿠키를 직접 만질 수 없다. 
수동 설정이므로, 브라우저의 혜택을 받을 수 없게 된다.


### tRPC Procedure에서 Cookie 설정
```ts
const userRouter = router({
  setLanguage: protectedProcedure
    .input(z.object({ language: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { res } = ctx;
      
      // 쿠키 설정
      res.setHeader('Set-Cookie', [
        `lang=${input.language}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
      ]);

      return { success: true };
    }),
});
```


## 결론
쿠키를 안전하고 효과적으로 관리하기 위해서는 브라우저에게 쿠키 관리를 맡기는 것이 가장 좋다. 이를 위해 tRPC 클라이언트에서 credentials 옵션을 설정하여 브라우저가 쿠키를 자동으로 포함하도록 해야한다.

또한, 서버 측에서는 응답 시 Set-Cookie 헤더를 설정하기 위해 tRPC 컨텍스트에 res 객체를 포함시켜야 한다.

document.cookie를 사용하여 쿠키를 수동으로 설정하는 것은 보안상의 이유로 피해야 한다.

# 출처
https://trpc.io/docs/server/context  
https://trpc.io/docs/server/middleware  
https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie

https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch  
https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials

https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
