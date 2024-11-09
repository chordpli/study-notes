
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
import { NextResponse } from 'next/server'

import { createApiClient } from '~/utils/supabase'

interface CreateContextOptions {
  ...
  res: trpcNext.NextApiResponse
}

export async function createContextInner(opts: CreateContextOptions) {
  return opts
}

export type Context = Awaited<ReturnType<typeof createContextInner>>

export async function createContext(opts: trpcNext.CreateNextContextOptions): Promise<Context> {
  return await createContextInner({
    ...
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

추가적으로 동일 출처 요청(same-origin request)인 경우에는 credentials 옵션을 설정하지 않아도 쿠키가 자동으로 포함된다. 
그러나 교차 출처 요청(cross-origin request)인 경우에는 credentials: 'include'를 명시적으로 설정해야 한다.

tRPC를 사용할 때 클라이언트와 서버가 동일한 오리진(origin)이라면, credentials: 'same-origin'(기본값)을 사용할 수 있지만, 
환경의 변경이나 확장성을 고려하여 credentials: 'include'를 설정하는 것이 안전하다.

#### 어떤 방법을 사용할 것인가?
두 가지 방법 모두 사용할 수 있지만, 권장되는 방법은 `fetch` 옵션을 사용하는 방법이다.
여기서부터는 tRPC 문서가 아니라 MDN에서 제공하는 문서를 참고하였다.

쉽게 말해, 우리가 credentials: 'include'를 사용하는 것은 마치 부모님께 중요한 일을 맡기는 것과 같습니다.

아이에게 복잡하고 위험한 일을 직접 시키면 실수나 사고가 날 수 있습니다. 대신에 부모님께서 그 일을 처리해 주시면 더 안전하고 효율적이겠죠. 마찬가지로, 브라우저에게 쿠키 관리와 보안을 맡기면 우리가 직접 복잡한 보안 사항을 처리하지 않아도 안전하게 동작할 수 있습니다.

1. HttpOnly 쿠키의 전송 가능 여부
credentials: 'include' 사용 시:

브라우저가 부모님 역할을 합니다. 브라우저는 HttpOnly 쿠키를 포함하여 모든 중요한 쿠키를 자동으로 요청에 포함시킵니다.
클라이언트 측 스크립트(아이)는 쿠키(중요한 물건)를 직접 만질 수 없습니다. 하지만 브라우저(부모님)는 이를 안전하게 관리하고, 필요한 때에 서버에 전달합니다.
document.cookie를 통한 수동 설정 시:

클라이언트 측 스크립트(아이)는 HttpOnly 쿠키에 접근할 수 없습니다. 즉, 중요한 쿠키를 직접 만질 수 없습니다.
이로 인해 인증이나 세션 관리에 필요한 쿠키가 누락될 수 있습니다. 마치 아이가 부모님 없이 중요한 일을 처리하려고 하지만 필요한 도구를 가지지 못한 것과 같습니다.
근거:

MDN Web Docs - HttpOnly 쿠키는 클라이언트 측 스크립트에서 접근할 수 없도록 설계되었습니다.

"HttpOnly 쿠키는 클라이언트 측 스크립트에서 접근할 수 없습니다. 이는 XSS 공격으로부터 쿠키를 보호하기 위한 것입니다."

MDN Web Docs: HTTP cookies - HttpOnly 속성

2. 브라우저 보안 정책 준수
credentials: 'include' 사용 시:

브라우저에게 쿠키 관리를 맡기면, 브라우저는 정해진 규칙(보안 정책)을 따라 쿠키를 안전하게 전송합니다.
우리는 복잡한 보안 사항을 직접 처리하지 않아도 됩니다. 이는 부모님이 교통 법규를 잘 알고 안전하게 운전해 주시는 것과 같습니다.
document.cookie를 통한 수동 설정 시:

클라이언트 측 스크립트에서 쿠키를 수동으로 설정하려고 하면, 브라우저의 보안 정책에 위배될 수 있습니다.
일부 브라우저는 이러한 시도를 차단하거나 예상치 못한 동작을 할 수 있습니다. 이는 **아이가 위험한 도구를 사용하려고 할 때 부모님이 이를 막는 것과 비슷합니다.
근거:

브라우저는 특정 헤더(예: Cookie 헤더)를 클라이언트 측 스크립트에서 수동으로 설정하는 것을 제한합니다.

"일부 헤더는 클라이언트 측에서 수정할 수 없습니다. 이러한 헤더를 '금지된 헤더 이름'이라고 합니다."

MDN Web Docs: Forbidden header name

3. 보안 및 취약점 위험 감소
credentials: 'include' 사용 시:

쿠키를 직접 다루지 않으므로, 악의적인 스크립트가 쿠키를 훔쳐가는 것을 방지할 수 있습니다. 이는 부모님이 중요한 물건을 안전하게 보관하여 도둑이 쉽게 훔쳐갈 수 없도록 하는 것과 같습니다.
document.cookie를 통한 수동 설정 시:

클라이언트 측 스크립트에서 쿠키를 직접 다루면, 악의적인 코드가 쿠키를 탈취할 수 있습니다. 이는 아이의 주머니에 돈을 많이 넣어두면 도둑이 쉽게 훔쳐갈 수 있는 것과 비슷합니다.
근거:

OWASP(국제 웹 애플리케이션 보안 프로젝트)는 쿠키를 클라이언트 측에서 직접 다루는 것이 보안 취약점을 초래할 수 있다고 경고합니다.

"HttpOnly 속성은 클라이언트 측 스크립트에서 쿠키에 접근할 수 없도록 함으로써 XSS 공격으로부터 세션 쿠키를 보호합니다."

OWASP Cheat Sheet: Session Management

4. 개발 편의성과 유지 보수성 향상
credentials: 'include' 사용 시:

코드가 간결하고 이해하기 쉬우며, 브라우저가 많은 부분을 알아서 처리해 주므로 개발자가 신경 쓸 부분이 줄어듭니다. 이는 아이에게 복잡한 일을 맡기기보다 부모님이 대신 처리해 주는 것과 같습니다.
document.cookie를 통한 수동 설정 시:

추가적인 코드와 로직이 필요하며, 브라우저마다 동작이 다를 수 있어 유지 보수가 어렵습니다. 이는 아이에게 너무 복잡한 일을 맡겨서 문제가 생길 수 있는 것과 같습니다.
근거:

브라우저마다 보안 정책이나 쿠키 처리 방식이 다를 수 있으므로, 수동으로 쿠키를 관리하면 호환성 문제가 발생할 수 있습니다.

"쿠키의 동작은 브라우저마다 다를 수 있으므로, 표준에 따라 코드를 작성하는 것이 중요합니다."

MDN Web Docs: HTTP cookies

5. CORS(교차 출처 리소스 공유) 처리 시 이점
credentials: 'include' 사용 시:

교차 출처 요청에서 쿠키를 포함하려면 서버 측에서 적절한 CORS 설정을 해야 하지만, 이는 안전한 통신을 위해 필요한 과정입니다.
브라우저가 CORS 정책을 준수하며 요청을 처리하므로, 예상치 못한 문제가 발생할 가능성이 줄어듭니다.
document.cookie를 통한 수동 설정 시:

커스텀 헤더를 수동으로 설정하면 CORS 사전 요청(OPTIONS 메서드)이 발생하고, 서버에서 이를 처리해야 하는 추가적인 부담이 생깁니다.
브라우저 보안 정책에 의해 요청이 차단될 수도 있어 문제가 발생할 수 있습니다.
근거:

MDN Web Docs는 교차 출처 요청에서 자격 증명을 포함하려면 credentials 옵션과 서버 측 설정이 필요하다고 설명합니다.

"자격 증명이 필요한 요청을 할 때는 credentials 옵션을 설정하고, 서버에서 Access-Control-Allow-Credentials 헤더를 설정해야 합니다."

MDN Web Docs: CORS와 자격 증명





## 결론
쿠키를 안전하고 효과적으로 관리하기 위해서는 브라우저에게 쿠키 관리를 맡기는 것이 가장 좋습니다. 이를 위해 tRPC 클라이언트에서 credentials 옵션을 설정하여 브라우저가 쿠키를 자동으로 포함하도록 해야 합니다.

또한, 서버 측에서는 응답 시 Set-Cookie 헤더를 설정하기 위해 tRPC 컨텍스트에 res 객체를 포함시켜야 합니다.

document.cookie를 사용하여 쿠키를 수동으로 설정하는 것은 보안상의 이유로 피해야 하며, 브라우저의 보안 정책에 의해 제한될 수 있습니다.



# 출처
https://trpc.io/docs/server/context
https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie

https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials