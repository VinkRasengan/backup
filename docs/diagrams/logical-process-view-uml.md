# Sơ Đồ Góc Nhìn Logic và Process - Kiến Trúc Microservices

## 🏗️ Góc Nhìn Logic (Logical View)

### Sơ Đồ Kiến Trúc Logic Tổng Quan

```plantuml
@startuml
title Anti-Fraud Platform - Logical Architecture View

package "Presentation Layer" {
    [React SPA] as client
    [Mobile App] as mobile
    [Admin Dashboard] as admin
}

package "API Gateway Layer" {
    [Kong/Nginx Gateway] as kong
    [Express.js Gateway] as express_gateway
}

package "Business Logic Layer" {
    package "Core Services" {
        [Auth Service] as auth_service
        [Link Service] as link_service
        [Community Service] as community_service
        [Chat Service] as chat_service
        [News Service] as news_service
        [Admin Service] as admin_service
    }
    
    package "Security Services" {
        [CriminalIP Service] as criminalip_service
        [PhishTank Service] as phishtank_service
    }
    
    package "Analytics Services" {
        [Analytics Service] as analytics_service
        [ETL Service] as etl_service
        [Spark Service] as spark_service
    }
    
    package "Event Management" {
        [Event Bus Service] as eventbus_service
    }
}

package "Data Layer" {
    [Firebase Firestore] as firestore
    [Redis Cache] as redis
    [Hadoop HDFS] as hdfs
}

' Logical connections
client --> kong : HTTPS
mobile --> kong : HTTPS
admin --> kong : HTTPS

kong --> express_gateway : Internal
express_gateway --> auth_service : Auth
express_gateway --> link_service : Links
express_gateway --> community_service : Community
express_gateway --> chat_service : Chat
express_gateway --> news_service : News
express_gateway --> admin_service : Admin
express_gateway --> criminalip_service : Security
express_gateway --> phishtank_service : Phishing
express_gateway --> analytics_service : Analytics
express_gateway --> etl_service : ETL
express_gateway --> spark_service : ML
express_gateway --> eventbus_service : Events

' Service-to-Service
auth_service --> link_service : Validation
link_service --> criminalip_service : IP Check
link_service --> phishtank_service : Phishing Check
community_service --> auth_service : User Info

' Event-driven
auth_service --> eventbus_service : Events
link_service --> eventbus_service : Events
community_service --> eventbus_service : Events
chat_service --> eventbus_service : Events
news_service --> eventbus_service : Events

' Data access
auth_service --> firestore : User Data
link_service --> firestore : Link Data
community_service --> firestore : Community Data
chat_service --> firestore : Chat Data
news_service --> firestore : News Data

' Cache
auth_service --> redis : Sessions
link_service --> redis : Cache
community_service --> redis : Cache

' Big data
etl_service --> hdfs : Pipeline
spark_service --> hdfs : Processing

@enduml
```

### Sơ Đồ Domain Model Logic

```plantuml
@startuml
title Anti-Fraud Platform - Domain Model

class User {
    +String userId
    +String email
    +String username
    +String role
    +authenticate()
    +updateProfile()
}

class Link {
    +String linkId
    +String originalUrl
    +String userId
    +RiskScore riskScore
    +validate()
    +analyzeRisk()
}

class Post {
    +String postId
    +String userId
    +String content
    +Integer voteCount
    +create()
    +vote()
}

class SecurityEvent {
    +String eventId
    +String userId
    +String eventType
    +record()
}

' Relationships
User ||--o{ Link : creates
User ||--o{ Post : creates
User ||--o{ SecurityEvent : triggers
Link ||--|| RiskScore : has

@enduml
```

## 🔄 Góc Nhìn Process (Process View)

### Sơ Đồ Process Tổng Quan

```plantuml
@startuml
title Anti-Fraud Platform - Process View

actor User as user
participant "API Gateway" as gateway
participant "Auth Service" as auth
participant "Link Service" as link
participant "Security Services" as security
participant "Event Bus" as eventbus
participant "Firebase" as firebase

== User Authentication Process ==
user -> gateway: Login Request
gateway -> auth: Authenticate
auth -> firebase: Validate
firebase -> auth: User Data
auth -> eventbus: Login Event
auth -> gateway: Success
gateway -> user: Login Complete

== Link Validation Process ==
user -> gateway: Submit Link
gateway -> link: Validate
link -> security: Check IP
security -> link: IP Result
link -> security: Check Phishing
security -> link: Phishing Result
link -> eventbus: Analysis Event
link -> firebase: Store Data
link -> gateway: Result
gateway -> user: Validation Complete

== Community Interaction Process ==
user -> gateway: Create Post
gateway -> community: Process
community -> auth: Validate User
auth -> community: User Valid
community -> firebase: Store
community -> eventbus: Post Event
community -> gateway: Success
gateway -> user: Post Created

@enduml
```

### Sơ Đồ Process Chi Tiết - Link Validation

```plantuml
@startuml
title Link Validation Process - Detailed

actor User as user
participant "API Gateway" as gateway
participant "Link Service" as link
participant "CriminalIP" as criminalip
participant "PhishTank" as phishtank
participant "Event Bus" as eventbus
participant "Firebase" as firebase

user -> gateway: POST /api/links/validate
gateway -> link: Forward Request

link -> link: Parse URL
alt URL Valid
    link -> criminalip: Check IP
    criminalip -> link: IP Analysis
    
    link -> phishtank: Check Phishing
    phishtank -> link: Phishing Result
    
    link -> link: Calculate Risk Score
    link -> firebase: Store Analysis
    link -> eventbus: Analysis Event
    link -> gateway: Return Result
    gateway -> user: Validation Complete
else URL Invalid
    link -> gateway: Return Error
    gateway -> user: Validation Failed
end

@enduml
```

### Sơ Đồ Process Chi Tiết - Event-Driven Communication

```plantuml
@startuml
title Event-Driven Communication Process

participant "Service A" as service_a
participant "Event Bus" as eventbus
participant "Service B" as service_b
participant "Service C" as service_c
participant "Firebase" as firebase

== Event Publishing ==
service_a -> service_a: Business Event
service_a -> eventbus: Publish Event
eventbus -> firebase: Store Event
eventbus -> service_b: Deliver Event
eventbus -> service_c: Deliver Event
eventbus -> service_a: Confirmation

== Event Consumption ==
service_b -> service_b: Receive Event
service_b -> service_b: Process Event
service_b -> eventbus: Acknowledge

service_c -> service_c: Receive Event
service_c -> service_c: Process Event
service_c -> eventbus: Acknowledge

@enduml
```

## 🎯 Sơ Đồ Tổng Hợp - Logic vs Process

```plantuml
@startuml
title Anti-Fraud Platform - Logical vs Process View Comparison

!define RECTANGLE class

package "Logical View (Static Structure)" {
    RECTANGLE "Presentation Layer" as L1
    RECTANGLE "API Gateway Layer" as L2
    RECTANGLE "Business Logic Layer" as L3
    RECTANGLE "Data Layer" as L4
    
    L1 --> L2 : HTTP/HTTPS
    L2 --> L3 : Internal Routing
    L3 --> L4 : Data Access
}

package "Process View (Dynamic Behavior)" {
    RECTANGLE "User Request" as P1
    RECTANGLE "Authentication" as P2
    RECTANGLE "Business Logic" as P3
    RECTANGLE "Data Processing" as P4
    RECTANGLE "Response" as P5
    
    P1 --> P2 : Login
    P2 --> P3 : Validate
    P3 --> P4 : Process
    P4 --> P5 : Return
}

note right of L1
    **Logical View Focus:**
    - Component Structure
    - Data Models
    - Service Relationships
    - Architecture Layers
end note

note right of P1
    **Process View Focus:**
    - Request Flow
    - Business Logic
    - Data Flow
    - Service Interactions
end note

@enduml
```

## 📊 Bảng So Sánh Góc Nhìn Logic và Process

| **Aspect** | **Góc Nhìn Logic** | **Góc Nhìn Process** |
|------------|-------------------|---------------------|
| **Mục đích** | Cấu trúc tĩnh và mối quan hệ | Luồng xử lý động và tương tác |
| **Tập trung** | Kiến trúc, domain model | Workflow, business process |
| **Thời gian** | Tĩnh (static) | Động (dynamic) |
| **Thành phần** | Services, components | Actors, processes |
| **Mối quan hệ** | Structural | Behavioral |
| **Sử dụng** | Thiết kế kiến trúc | Business analysis |

## 🔍 Giải Thích Chi Tiết

### 🏗️ Góc Nhìn Logic (Logical View)

**Định nghĩa**: Góc nhìn logic mô tả cấu trúc tĩnh của hệ thống, bao gồm các thành phần, mối quan hệ và tổ chức kiến trúc.

**Đặc điểm chính**:
- **Tĩnh (Static)**: Mô tả cấu trúc tại một thời điểm cụ thể
- **Cấu trúc (Structural)**: Tập trung vào tổ chức và mối quan hệ
- **Kiến trúc (Architectural)**: Thể hiện các layer và component

**Các thành phần chính**:
1. **Presentation Layer**: React SPA, Mobile App, Admin Dashboard
2. **API Gateway Layer**: Kong/Nginx, Express.js Gateway
3. **Business Logic Layer**: Core Services, Security Services, Analytics Services
4. **Data Layer**: Firebase Firestore, Redis Cache, Hadoop HDFS

**Lợi ích**:
- Hiểu rõ cấu trúc hệ thống
- Thiết kế kiến trúc hiệu quả
- Tổ chức code và team
- Phân chia trách nhiệm rõ ràng

### 🔄 Góc Nhìn Process (Process View)

**Định nghĩa**: Góc nhìn process mô tả luồng xử lý động của hệ thống, bao gồm các tương tác, workflow và business logic.

**Đặc điểm chính**:
- **Động (Dynamic)**: Mô tả hành vi theo thời gian
- **Hành vi (Behavioral)**: Tập trung vào tương tác và luồng xử lý
- **Business Logic**: Thể hiện quy trình nghiệp vụ

**Các process chính**:
1. **User Authentication**: Login, validation, session management
2. **Link Validation**: URL parsing, security checks, risk analysis
3. **Community Interaction**: Post creation, user validation, event publishing
4. **Event-Driven Communication**: Event publishing, consumption, acknowledgment

**Lợi ích**:
- Hiểu rõ business logic
- Debug và troubleshoot hiệu quả
- Tối ưu hóa performance
- Phân tích workflow

## 🎯 Kết Luận

### Tại sao cần cả hai góc nhìn?

1. **Bổ sung lẫn nhau**: Logic view cho cấu trúc, Process view cho hành vi
2. **Đối tượng khác nhau**: Developers cần logic view, Business analysts cần process view
3. **Mục đích khác nhau**: Thiết kế vs Phân tích

### Ứng dụng thực tế:

**Góc nhìn Logic**:
- Thiết kế kiến trúc hệ thống
- Tổ chức team và code
- Lập kế hoạch deployment
- Phân chia trách nhiệm

**Góc nhìn Process**:
- Phân tích business requirements
- Debug và troubleshooting
- Performance optimization
- User experience design

Cả hai góc nhìn đều cần thiết để có cái nhìn toàn diện về kiến trúc Microservices, giúp team phát triển hiểu rõ cả cấu trúc và hành vi của hệ thống.
