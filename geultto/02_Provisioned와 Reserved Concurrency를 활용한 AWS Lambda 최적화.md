# Concurrency 구성 이유

얼마 전, 회사의 웹 어플리케이션을 ECS에서 Lambda로 이전하였다. EPR 성격을 띠고 있는 서비스로, 업무 시간에만 사용하는 서비스, 사용자와 상호작용이 많이 없는 트래픽이 적은 서비스적 특성에 따른 효율성을 위해 Lambda 이전을 검토했다.

운영 환경을 이전하면서 약 400$에 달하는 금액을 절약할 수 있었고, 이전하면서 발생하는 크리티컬한 이슈도 없어서 꽤 성공적인 프로젝트였다.

큰 이슈가 없어서 인프라에 대해 신경을 끄고 살다가, 옆자리 인프라 고수분으로부터 업무 부탁을 받게 되었다. 

“준호님, 이거 Reserved Concurrency 설정해서 배포해 주실 수 있으실까요?”

아차, Provisioned Concurrency만 설정하고 다음에 Reserved Concurrency를 설정한다는 것을 깜빡하고 있었다.

우리 회사는 여러 Batch 작업을 Lambda를 통해 작동시키고 있었는데, 웹 애플리케이션을 Lambda로 전환했으니 꼭 설정해야 하는 항목이었다.

Lambda 서비스의 경우 Concurrency를 설정하게 되는데, 이 이유를 알기 위해 Lambda부터 다시 조사해 보자.

## Lambda?

AWS 에서는 “사실상 모든 유형의 애플리케이션이나 백엔드 서비스에 대한 코드를 실행하는 서비스”라고 소개하고 있다. 기능 소개에서는 “이벤트에 대한 응답으로 코드를 실행하고 자동으로 기본 컴퓨터 리소스를 관리하는 서버리스 컴퓨팅 서비스"라고 설명한다.

> 서버리스 컴퓨팅이란?

서버리스 컴퓨팅은 서드 파티 관리 서버 인프라에서 애플리케이션을 구축하고 배포할 수 있는 애플리케이션 개발 모델입니다. 퍼블릭 클라우드 제공업체의 서버리스 오퍼링은 일반적으로 이벤트 기반 실행 모델을 통해 온디맨드로 미터링되기 때문에, 서버리스 기능이 유휴 상태일 때는 비용이 들지 않습니다.

서버리스 클라우드가 제공하는 클라우드 인프라와 애플리케이션의 스케일링을 모두 관리한다는 점에서 다른 클라우드 컴퓨팅 모델과 차이를 보입니다. 서버리스 애플리케이션은 호출 시 온디맨드로 자동 시작되는 컨테이너에 배포됩니다.
> 

Lambda를 사용하게 되면, 클라우드 제공 업체에서 애플리케이션의 많은 부분을 관리해 주기 때문에 개발자는 관리 포인트들에 대한 고민 없이 서비스 개발에만 집중할 수 있다.

특히 사용자가 많지 않거나, 이제 막 서비스를 준비하는 개발자들에게 가장 인상적인 문구가 있다.

“사용한 컴퓨팅 시간만큼만 비용을 지불하고, 코드가 실행되지 않을 때는 요금이 부과되지 않습니다.”

자 그럼 람다를 사용하는 이유를 알았는데, Concurrency는 왜 설정해야 하는 걸까?

### Provisioned 설정 이유

Lambda의 경우 일정 시간 동안 요청이 들어오지 않으면 해당 함수는 종료된다. 요청이 들어오면 다시 함수가 새롭게 시작되는데, 이는 컴퓨팅을 실행시키는 것과 동일하다. 즉, 오랜 기간동안 요청이 없다가 새롭게 요청하는 사용자는 서버가 실행될 동안 기다리게 되는데 이를 콜드 스타트라고 한다. 특히 준비 시간이 긴 자바 스프링의 경우에는 필수 설정이라 볼 수 있다.

콜드 스타트를 대비하기 위해서 Provisioned Concurrency를 설정할 수 있다. 수신 함수 요청에 즉시 응답하도록 Lambda를 항상 준비 상태로 유지 하므로 콜드 스타트로 인한 지연 시간을 줄일 수 있다. 하지만 Provisioned Concurrency 자체가 응답할 수 있도록 계속하여 컴퓨팅을 대기시켜 놓는 것과 동일하므로, AWS 계정에 요금이 추가된다.

쉽게 이야기해 보면, 이 친구는 5대기조와 같은 역할을 한다.

“너 언제든 출동할 수 있도록 준비해! 그 대신 대기 하는 시간에 월급 줄게~”

Provisioned Concurrency 설정 시 비용과 성능 간의 균형을 고려해야 한다. 항상 준비 상태로 유지하기 때문에 비용이 발생하지만, 서비스의 응답성을 확보하여 사용자 경험을 향상시킬 수 있다. 이를 통해 우리는 주요 서비스에 대한 신뢰성을 높일 수 있었다.

### **Reserved 설정 이유**

Lambda 함수 규모 조정 이행이라는 AWS 문서를 보면 알 수 있다.

“기본적으로 Lambda는 사용자 계정에 AWS 리전 애 모든 함수에 걸쳐 총 1,000개 동시 실행 한도의 동시성을 제공합니다.”

즉, 사용 중인 람다 함수가 동시에 1,000개를 넘어가면 내가 지금 당장 필요한 함수를 실행하지 못할 수도 있다. 사용자에게 제공되는 운영 서비스 서버가 Lambda로 올라가 있고, 배치로 돌아가는 람다가 있다고 가정할 때 배치 람다 때문에 필요한 함수의 실행이 지연될 위험이 있다.

Reserved Concurrency는 특정 Lambda 함수가 필요한 동시성 자원을 항상 확보해 둘 수 있도록 설정한다. 특정 Lambda 함수에 동시 실행을 예약해 필요한 경우 다른 함수의 자원을 사용하지 않도록 보장하는 설정이다. 이는 특정 함수의 동시성 리소스를 우선 보장함으로써, 다른 함수가 이 리소스를 사용하지 못하도록 설정해 중요 서비스의 안정성을 유지하는 데 기여한다.

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/52aa273a-715b-49c5-9270-a8e89faa4e23/image.png)

쉽게 이야기 해 보면, 학창 시절 짝꿍과 책상에 금 그어놓고 넘어오지 말라고 요청하는 것과 같다.

“너 물건 여기 넘어오면 안 돼, ~~넘어오면 다 내 거야~~”

Reserved Concurrency를 설정하지 않으면 과도한 트래픽으로 인해 특정 함수가 스로틀링(Throttling)되어 실행이 지연되거나 실패할 수 있다. 특히 중요한 사용자 요청을 처리하는 함수라면 이러한 상황은 치명적일 수 있다. 따라서, 중요한 운영 서버 함수에는 반드시 Reserved Concurrency를 설정하여 최소한의 동시 실행을 보장해야 한다.

운영 서버에 400개의 예약된 동시성을 설정한다면, 해당 함수는 400개의 동시성 함수를 보장받을 수 있다. 다른 함수들이 동시에 수백 건이 올라도, 내가 설정한 Reserved Concurrency로 인하여 남은 600개의 동시성 풀을 공유하게 된다. (400개를 설정한 람다 서비스의 동시성을 보장하기 위해)

운영 서버는 무조건 함수 실행을 보장받아야 하므로, 우리 서비스에 필수적으로 적용되어야 하는 설정인 것이다.

# 설정방법

## AWS Lambda에서 설정하기

### Provisioned Concurrency

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/673488ad-56b5-4b37-ab15-d6c6a92d7aef/image.png)

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/15b525e0-db88-4d45-b91c-53f5da94872a/image.png)

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/bb249d5e-6556-454d-845d-e436b8bdc59a/image.png)

> 버전 만들기

Provisioned Concurrency를 구성할 때는 버전 또는 별칭을 구성해야 한다. Provisioned Concurrency에서는 별칭에 버전이 Latest로 지정되면 Concurrency 설정이 불가능하기 때문에, 별칭 대신 버전을 지정하는 것이 좋다.
> 

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/0da76e94-038b-4b47-943e-8f8f2aa4fd07/image.png)

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/d67182a4-864c-447a-aeb2-e832d30d0e77/image.png)

### Reserved Concurrency

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/1efb0bf9-6516-4438-9953-fb1cf6a9062e/image.png)

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/2167f7e7-3301-40b6-ae44-2de986956c34/image.png)

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/1b22b23d-4a13-4f96-b3e4-e4b67854fbff/image.png)

## SAM을 이용한 설정 방법

### Provisioned Concurrency

```jsx
Resources:
  AppApiLambdaFunction:
    Type: AWS::Serverless::Function
    Properties:
    ...
      AutoPublishAlias: stage
      ProvisionedConcurrencyConfig:
        ProvisionedConcurrentExecutions: 1
```

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/c058d87e-b61c-44ce-ad5a-c2b582ac20d6/image.png)

AutoPublishAlias를 설정하여 Provisioned Concurrency에 필요한 Version을 자동으로 발행할 수 있다.

이는 코드가 변경될 때마다 새로운 버전을 생성하여, 지속적으로 최신 버전에 대해 Concurrency 설정을 유지할 수 있도록 한다.

### Reserved Concurrency

```jsx
Resources:
  AppApiLambdaFunction:
    Type: AWS::Serverless::Function
    Properties:
    ...
      ReservedConcurrentExecutions: 200
```

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/41f3354d-006d-435f-9302-d2be62ee08eb/e847f43b-2edc-459c-ac8b-85f012f11f7a/image.png)

# 마치며

Lambda의 Concurrency 설정은 서비스의 안정성 그리고 성능에 직접적으로 많은 영향을 미치는 설정입니다. Provisioned Concurrency로 콜드 스타트 문제를 다룰 수 있으며, Reserved Concurrency로 최소 함수 실행을 보장받을 수 있습니다. 특히 높은 트래픽의 서비스라면 Reserved Concurrency를 설정할 경우 성능 저하를 방지할 수 있으니, 서비스의 특징에 따라 해당 옵션들을 설정하여 효율적으로 서비스를 운영하면 좋을 것 같습니다!

---

# 출처

[서버리스 컴퓨팅 서비스 - 무료 AWS Lambda - AWS](https://aws.amazon.com/ko/pm/lambda/?gclid=Cj0KCQjw4Oe4BhCcARIsADQ0csnMAM6ozcEUvezBYkKCLr4pl-1E6uALjJNkUzOmmxXnMVdjvP84VLEaAiLLEALw_wcB&trk=b28d8305-f5fb-4858-9ae6-04a78cfcc154&sc_channel=ps&ef_id=Cj0KCQjw4Oe4BhCcARIsADQ0csnMAM6ozcEUvezBYkKCLr4pl-1E6uALjJNkUzOmmxXnMVdjvP84VLEaAiLLEALw_wcB:G:s&s_kwcid=AL!4422!3!651510601848!e!!g!!aws%20lambda!19836398350!150095232634)

[Lambda 함수 규모 조정 이행 - AWS Lambda](https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/lambda-concurrency.html)

[서버리스 컴퓨팅이란?- 서버리스 컴퓨팅 설명 - AWS](https://aws.amazon.com/ko/what-is/serverless-computing/)

[서버리스(serverless)란?](https://www.redhat.com/ko/topics/cloud-native-apps/what-is-serverless)

[Lambda 함수 규모 조정 이행 - AWS Lambda](https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/lambda-concurrency.html)

[함수에 대해 예약된 동시성 구성 - AWS Lambda](https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/configuration-concurrency.html)

[함수에 대해 프로비저닝된 동시성 구성 - AWS Lambda](https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/provisioned-concurrency.html)

[AWS::Serverless::Function - AWS Serverless Application Model](https://docs.aws.amazon.com/ko_kr/serverless-application-model/latest/developerguide/sam-resource-function.html)