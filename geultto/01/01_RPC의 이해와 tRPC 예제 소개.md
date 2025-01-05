# RPC

## RPC에 관심을 갖게 된 이유?

RPC에 관심을 갖게 된 이유로는 두 가지가 존재합니다.

먼저, 회사에서 새롭게 진행하는 서비스에서 tRPC를 사용하기로 했습니다. 별도의 외부 서버를 둬서 API를 호출하는 것이 아닌, Next.js를 사용하여 백엔드 서버까지 구현하려 하고 있어요. 해당 프로젝트에 기여하려면 tRPC, 즉 RPC에 대해 어느 정도 이해가 필요하다고 생각했습니다.

또 하나는, 많은 공고에서 RPC가 많이 보이고 있기 때문이에요. 흔히 이야기하는 테크 기업들에서 필수 사항은 아니지만, 해당 기술을 사용하고 있거나 우대사항에 RPC 경험을 서술하고 있거든요.

회사의 프로젝트 기술에 이해도를 높이기 위해, 많은 회사에서 사용하고 있는 기술이라는 호기심을 충족해 보기 위해 공부해 보려고 합니다!

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/795ca57b-3fb0-4d9e-92b8-1912ded93ac9/image.png)

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/65cfbd7b-2e84-44bf-8dc4-93f0c3d57de6/image.png)

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/0bffaa21-ffc5-42f6-a865-7d833363c431/image.png)

![이미지 출처 - 뱅크샐러드](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/a0d807ea-41d5-4685-8fdb-1682f3472bc4/image.png)

이미지 출처 - 뱅크샐러드

## RPC는 무엇일까요?

RPC는 Remote Procedure Call, 한글로 하면 원격 프로시저 호출이라고 불립니다. 다른 프로세스 공간에 있는 프로시저를 호출할 수 있는 메커니즘입니다. 개발자가 원격 상호 작용에 대한 세부 정보를 명시적으로 작성하지 않고도 로컬 프로시저 호출인 것처럼 작성됩니다.

즉, 서버 개발자가 모델과 로직을 만들어두었다면 클라이언트 개발자는 서버에서 정의한 인터페이스를 사용하여 원격 프로시저를 호출할 수 있습니다. 클라이언트 측에서는 서버의 인터페이스에 맞는 스텁이나 프록시를 사용하여 호출해야 하므로, 일부 코딩이나 설정이 필요할 수 있습니다. 그러나, 네트워크 통신에 대한 복잡한 코딩 없이 원격 프로시저를 사용할 수 있습니다.

테크 기업에서 자주 언급되는 기술이라서 최근에 발표된 기술일 것으로 생각했지만, 실제로는 REST보다 훨씬 이전에 발표되어 오랫동안 사용되어 왔다는 것을 알게 되었습니다. 1970년대 이론적으로 제안되었으며, 1980년대에 Sun RPC와 같은 구현을 통해 실제 사용되기 시작했습니다. 초기에는 UNIX 환경 간의 통신을 위해 구현되었으며 주로 C언어에서 많이 사용되었습니다. 1990년대 후반부터 2000년대 초반에 걸쳐 인터넷과 웹 기술이 발전하면서, HTTP 기반의 통신 방식이 주목받기 시작했습니다. 이후  RESTful API가 보급되며 기존 RPC의 사용이 감소했습니다. 하지만 최근에는 gRPC, tRPC 등 다양한 형태로 발전하며 다시 주목받고 있습니다.

> **Stub**

Stub은 분산 컴퓨팅 환경에서 원격 서비스나 객체의 대리 역할을 하는 프로그램을 뜻합니다. 특히, RPC에서 클라이언트와 서버 간의 통신을 추상화하고 단순화하는 데 사용됩니다. Stub은 클라이언트 측과 서버 측 모두에 존재하며, 각기 다른 역할을 합니다.

Stub을 통해 원격 프로시저 호출의 복잡성을 숨기고, 프로그래머는 원격 프로시저를 마치 로컬 프로시저처럼 호출할 수 있습니다. Stub은 이러한 호출과 반환 과정에서 매개변수의 변환과 네트워크 통신을 처리하여, 원격 컴퓨터에서 실행되는 프로시저가 마치 로컬 컴퓨터에서 실행되는 것처럼 느껴지게 합니다.

클라이언트 스텁(Client Stub)은 클라이언트 측에서 원격 프로시저를 호출할 때 사용되며, 매개변수를 마샬링하여 서버로 전송합니다.
> 
> 
> 서버 스텁(Server Stub)은 서버 측에서 클라이언트의 요청을 받아 매개변수를 언마샬링하고 실제 프로시저를 호출합니다.
> 

### 장점

- 개발 편의성: 네트워크 통신의 복잡성을 추상화하여, 개발자는 원격 함수를 로컬 함수처럼 호출할 수 있습니다.
- 프로토콜 유연성: 다양한 프로토콜(TCP, HTTP/2 등)을 지원하여 유연한 통신이 가능합니다. 예를 들면, gRPC는 HTTP/2를 기반으로 하지만 다른 RPC 구현은 TCP, UDP, 또는 커스텀 프로토콜을 사용할 수 있어 사용 환경에 따라 적절한 선택을 할 수 있습니다.
- 유지보수성 향상: 인터페이스 정의를 통해 클라이언트와 서버 간의 약속이 명확하여, 코드 변경 시 영향 범위를 줄일 수 있다.

### 단점

- 네트워크 의존성: 네트워크 상태에 따라 성능이 크게 영향을 받을 수 있습니다.
- 에러 디버깅 어려움: 원격 호출 중에 발생하는 에러의 원인을 파악하기 어렵습니다.
- 버전 관리 복잡성: 클라이언트와 서버의 인터페이스 변경 시 호환성 문제가 발생할 수 있습니다. 이는 RPC뿐 아니라 분산 시스템에서 공통으로 발생하는 문제입니다. 일부 RPC 시스템의 강력한 타입 시스템은 버전 관리를 더 엄격하게 만들 수 있지만, 동시에 타입 안정성을 제공하여 런타임 오류를 줄일 수 있습니다.
- 보안 이슈: 원격 호출 시 데이터가 노출될 수 있어, 인증 및 암호화와 같은 추가적인 보안 조치가 필요합니다.

### 동작 방식

![https://www.javatpoint.com/what-is-rpc-in-operating-system](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/69425975-d060-4fbd-9587-8c05e75fe299/image.png)

https://www.javatpoint.com/what-is-rpc-in-operating-system

1. 클라이언트 애플리케이션에서 원격 프로시저를 로컬 함수처럼 호출합니다.
2. 호출된 함수의 매개변수를 직렬화(마샬링)하여 서버로 요청을 전송합니다.
3. 서버에서 수신한 메세지를 역직렬화(언마샬링)하여 원래의 매개변수로 복원하여 서버의 프로시저를 실행합니다.
4. 실행 결과를 직렬화하여 클라이언트로 전송합니다.
5. 클라이언트 스텁이 응답을 역직렬화하여 결과를 반환합니다.

### RPC 원칙

- 원격 프로시저 호출: 클라이언트는 원격 서버의 함수에 대해 RPC를 직접적으로 호출하는 데, 마치 클라이언트에 로컬로 호출된 것처럼 호출합니다. (스텁을 사용한 기능)
- 매개변수 전달: 클라이언트는 일반적으로 로컬 함수와 같은 방식으로 서버 함수에 매개변수를 전송합니다.
- 스텁: 함수 스텁은 클라이언트와 서버 모두에 존재합니다. 클라이언트 측에서는 함수를 직접적으로 호출합니다. 서버에서는 실제 함수를 호출합니다.

## REST와 RPC의 공통점과 차이는 무엇일까요?

RPC를 사용하면 프로그램이 프로시저나 서브 루틴을 다른 주소 공간, 일반적으로 공유 네트워크의 다른 컴퓨터에서 실행하도록 할 수 있습니다. 다른 머신에 있는 객체에서 메서드를 호출하는 것과 비슷합니다. 예를 들어 다른 채팅 애플리케이션에서 메시징 함수를 원격으로 직접 호출하여 해당 애플리케이션에 채팅 기능을 추가할 수 있습니다. 

REST API를 사용하면 원격 서버에서 특정 데이터 작업을 수행할 수 있습니다. 예를 들어 애플리케이션은 REST API를 사용하여 원격 서버에 직원 데이터를 삽입하거나 수정할 수 있습니다.

### 공통점

REST와 RPC는 서로 다른 시스템이나 구성 요소가 서로 통신할 수 있도록 합니다.

- **추상화:** API의 주요 목표는 네트워크 통신이지만 하위 수준 통신 자체는 API 개발자와 별개로 추상화됩니다. 따라서 개발자가 기술적 구현보다 기능에 집중할 수 있습니다.
- **통신:** REST와 RPC 모두 HTTP를 기본 프로토콜로 사용합니다. RPC와 REST에서 가장 많이 사용되는 메시지 형식은 JSON과 XML입니다. JSON은 가독성과 유연성 때문에 선호됩니다. (덧붙이자면 RPC는 TCP, UDP 등 다양한 프로토콜 사용이 가능합니다.)
- **언어 간 호환성:** 개발자는 원하는 언어로 RESTful 또는 RPC API를 구현할 수 있습니다. API의 네트워크 통신 요소가 RESTful 또는 RPC 인터페이스 표준을 준수하기만 하면 모든 프로그래밍 언어로 나머지 코드를 작성할 수 있습니다.

### 차이점

- REST
    
    
    | 강점 | 약점 |
    | --- | --- |
    | 각 요청은 독립적이며, 서버 상태에 의존하지 않습니다. | 무상태로 인해 모든 요청에 ​​중복된 데이터를 포함해야 할 수 있어 오버헤드가 발생할 수 있습니다. |
    | HTTP 메서드를 활용하므로 상호작용이 간단합니다. | 작업이 HTTP 메서드로 제한되어 복잡한 동작 표현이 어려울 수 있습니다. |
    | 응답을 캐시하여 성능을 향상시킬 수 있습니다. | 특히 대용량 페이로드의 경우 텍스트 형식은 오버헤드를 유발할 수 있습니다. |
    | 플랫폼에 독립적이며 상호 운용성을 촉진합니다. |  |
- RPC
    
    
    | 강점 | 약점 |
    | --- | --- |
    | 기능 기반 접근 방식을 통해 특정 요구 사항에 맞게 조정할 수 있습니다. | 서버 측 절차의 변경으로 인해 클라이언트가 중단될 수 있습니다. |
    | Protocol Buffers를 사용하는 gRPC 등은 효율적입니다. | 툴링, 디버깅, 설정으로 인해 복잡성이 추가될 수 있습니다. |
    | 양방향 스트리밍을 지원하여 실시간 애플리케이션 구현이 가능합니다. | 모든 RPC 프로토콜이 HTTP 기반인 것은 아니어서 웹 기반 상호작용이 복잡할 수 있습니다. |

REST: 자원을 표현하는 URL과 HTTP 메서드(GET, POST, PUT, DELETE 등)를 조합하여 CRUD 작업을 수행합니다. 예를 들어, `GET /users/1`은 ID가 1인 사용자를 가져오는 것입니다.

RPC: 메서드 호출을 통해 동작을 수행하며, 함수의 이름과 매개변수를 사용하여 서버의 기능을 호출합니다. 예를 들어, `getUserById(1)`은 ID가 1인 사용자를 가져오는 함수 호출입니다.

## RPC 종류

- RPyC(Remote Python Call)은 Python에서 원격 프로시저 호출을 가능하게 하는 라이브러리로, 투명한 원격 접근을 제공하여 분산 컴퓨팅과 클러스터링을 쉽게 구현할 수 있습니다.
- gRPC는 Google에서 개발한 오픈소스 RPC 프레임워크로, HTTP/2를 기반으로 이루어져 있습니다. 이를 통해 클라이언트 애플리케이션이 다른 컴퓨터의 서버 애플리케이션의 메서드를 로컬 객체처럼 직접 호출할 수 있어 분산 애플리케이션과 서비스를 더욱 쉽게 만들 수 있습니다. gRPC는 다양한 환경에서 실행되고 통신할 수 있으며, 여러 프로그래밍 언어를 지원합니다.
    - 예를 들어, Java로 gRPC 서버를 만들고, Go, Python 또는 Ruby등으로 클라이언트를 만들 수 있습니다.
- JSON-RPC는 JSON 형식을 사용하여 데이터를 교환하는 가벼운 원격 프로시저 호출 프로토콜로, 클라이언트가 JSON 형식의 요청 메시지를 생성하고 이를 서버에 전송하여 프로시저를 호출합니다. HTTP나 소켓 등을 통해 통신하며, 상태가 없는(stateless) 프로토콜입니다.

# tRPC

## Concept

> 당신의 풀스택 애플리케이션의 생산성을 높여주는 타입스크립트 추론을 경험해 보세요.
- tRPC Main Page
> 

tRPC(TypeScript Remote Procedure Call)는 TypeScript 모노리포를 위해 설계된 RPC의 한 구현입니다. Next.js와 같은 풀스택 프레임워크와 결합하여 사용할 때 장점을 극대화 할 수 있습니다.

```jsx
// HTTP/REST
const res = await fetch('/api/users/1');
const user = await res.json();

// RPC
const user = await api.users.getById({ id: 1 });
```

tRPC 앱의 네트워크 트래픽을 살펴보면 상당히 표준적인 HTTP 요청과 응답이라는 것을 알 수 있습니다. 하지만 서버와 클라이언트 간에 타입을 공유하기 때문에 코드를 작성하는 동안 구현 세부 사항에 대해 생각할 필요가 없습니다. 또한 타입 안정성을 확보할 수 있다는 것도 큰 장점입니다.

tRPC는 타입스크립트의 강력한 타입 시스템을 활용하여 클라이언트와 서버 간의 타입을 공유함으로써, 런타임 오류를 줄이고 개발 생산성을 높입니다. 코드 생성이나 스키마 정의가 없이도 자동으로 타입이 추론되며, 이는 개발자가 API 개발에 집중할 수 있도록 도와줍니다.

## 용어

| Term | Description |
| --- | --- |
| Procedure | API 엔드포인트 - query, mutation 또는 subscription을 사용할 수 있습니다. |
| Query | 데이터를 얻는 명령어입니다. |
| Mutation | 데이터를 생성, 수정, 삭제하는 명령어입니다. |
| Subscription | 지속적인 연결을 생성하고 변경 사항을 수신하는 프로시저입니다. |
| Router | 공유 네임 스페이스 아래의 프로시저 모음입니다. |
| Context | 모든 프로시저가 접근 가능한 컨텍스트. 세션 상태나 데이터베이스 연결 등에 일반적으로 사용됩니다. |
| Middleware | 프로시저 전, 후에 코드를 실행시킬 수 있는 함수로, 컨텍스트를 수정할 수 있습니다.  |
| Validation | "입력된 데이터에 옳은 자료가 포함되어 있나요?" |

## 예제

tRPC는 여러 패키지로 나뉘어 있어서 필요한 것만 설치할 수 있습니다

```bash
pnpm add @trpc/server@next @trpc/client@next
```

tRPC를 사용하기 위해서는 서버 측에서 `appRouter`를 정의하고, 클라이언트 측에서 해당 라우터를 기반으로 클라이언트를 생성해야 합니다. 자세한 설정 방법은 tRPC 공식 문서의 Quickstart 가이드를 참고하면 좋습니다.

아래는 tRPC를 사용하여 사용자 정보를 관리하는 간단한 예제입니다. 기본 설정 부분은 제외하였으며, RPC의 특성을 간략하게 보여줄 수 있는 부분이라 생각하여 첨부하였습니다. (해당 예제는 tRPC 공식 페이지에 첨부되어 있습니다.)

서버에서는 `appRouter`를 정의하여 사용자 관련 프로시저를 설정하고, 클라이언트에서는 해당 프로시저를 호출합니다.

```jsx
// 서버 설정
const appRouter = router({
  user: {
    list: publicProcedure.query(async () => {
      const users = await db.user.findMany();
      return users;
    }),
    byId: publicProcedure.input(z.string()).query(async (opts) => {
      const { input } = opts;
      const user = await db.user.findById(input);
      return user;
    }),
    create: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async (opts) => {
        const { input } = opts;
        const user = await db.user.create(input);
        return user;
      }),
  },
});

// 클라이언트 사용
// _app.tsx 설정
import {trpc} from "@/utils/trpc";

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default trpc.withTRPC(App);

// 사용
async function main() {
  const users = await trpc.user.list.query();
  console.log('Users:', users);

  const createdUser = await trpc.user.create.mutate({ name: 'sachinraja' });
  console.log('Created user:', createdUser);

  const user = await trpc.user.byId.query('1');
  console.log('User 1:', user);
}

```

# 마무리

tRPC를 사용하기 위해 RPC 부터 REST까지 정리를 하고 글을 쓰는데 거의 6시간 정도 소요된 것 같습니다. 솔직히 아직 이 개념을 이해했다고 말하기는 여전히 어려운 것 같습니다. 특히 tRPC의 여러 예제를 보면서 새롭게 구성해 보려고 했으나, 예제에 나와 있지 않은 부분들을 채우는 과정에서 여전히 도전을 마주하고 있습니다. 😅 

사실, 회사에서 당장 마주치게 된 문제들 때문에 주제를 변경할지 많이 고민했습니다만 우여곡절 끝에 글을 마무리할 수 있게 되어 다행입니다.

대표님께서 여러 번 tRPC 예제를 만들어주시며, RPC에 대한 특성에 관해 설명해주셨기 때문에 조금 더 이해할 수 있었고, 코드를 공유할 수 있다는 개념의 매력에 빠져들 수 있었습니다. 앞으로 많이 사용하게 될 것 같은데, 이해의 깊이가 깊어질 때마다 내용을 보충할 수 있으면 좋을 것 같습니다.

최대한 출처의 내용을 기반으로 글을 작성해 보았으나, 부족한 점이 있을 수 있습니다. 부정확한 부분이나 보완이 필요한 부분을 발견하셨다면, 꼭 댓글로 남겨주세요. 공부하고, 수정하고, 답변드릴 수 있는 부분들은 다시 답변드리도록 하겠습니다.

---

# 출처

[RPC와 REST 비교 - API 아키텍처 간의 차이점 - AWS](https://aws.amazon.com/ko/compare/the-difference-between-rpc-and-rest/)

[RFC 1831: RPC: Remote Procedure Call Protocol Specification Version 2](https://datatracker.ietf.org/doc/html/rfc1831)

[What is Remote Procedure Call (RPC)? | Definition from TechTarget](https://www.techtarget.com/searchapparchitecture/definition/Remote-Procedure-Call-RPC)

[What is RPC in Operating System - javatpoint](https://www.javatpoint.com/what-is-rpc-in-operating-system)

[Differences Between REST and RPC | Baeldung on Computer Science](https://www.baeldung.com/cs/rest-vs-rpc)

[Introduction to gRPC](https://grpc.io/docs/what-is-grpc/introduction/)

[RPyC - Transparent, Symmetric Distributed Computing — RPyC](https://rpyc.readthedocs.io/en/latest/)

[tRPC - Move Fast and Break Nothing. End-to-end typesafe APIs made easy. | tRPC](https://trpc.io/)

[Remote procedure call](https://en.wikipedia.org/wiki/Remote_procedure_call)

[Stub (distributed computing)](https://en.wikipedia.org/wiki/Stub_(distributed_computing))