# CloudVault

CloudVault is a backend-focused cloud storage platform inspired by Google Drive and Dropbox. It allows users to securely upload, manage, and share files while enforcing authentication, authorization, and ownership controls.

The project is built to explore real-world backend engineering concepts such as object storage, JWT authentication, file metadata management, secure sharing, and containerized infrastructure.

---

## Features

### Authentication & Authorization

* User Registration
* User Login
* JWT-based Authentication
* Spring Security Integration
* Protected APIs

### File Management

* Upload Files
* Download Files
* Delete Files
* List User Files
* Ownership Enforcement

### File Storage

* MinIO Object Storage (S3-compatible)
* PostgreSQL Metadata Storage
* Separation of File Content and Metadata

### Sharing

* Public Share Links
* Password-Protected Share Links
* Expiring Share Links
* Secure Random Token Generation

### Error Handling

* Global Exception Handling
* Structured Error Responses
* Access Control Validation

---

## Tech Stack

### Backend

* Java 21
* Spring Boot
* Spring Security
* Spring Data JPA
* Hibernate

### Database

* PostgreSQL

### Object Storage

* MinIO

### Authentication

* JWT (JSON Web Tokens)

### Containerization

* Docker
* Docker Compose

---

## Architecture

```text
Client
   │
   ▼
Spring Boot API
   │
   ├── PostgreSQL
   │      └── File Metadata
   │
   └── MinIO
          └── Actual File Objects
```

---

## Project Structure

```text
src/main/java/com/CloudVault/Backend
│
├── auth
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── security
│   └── service
│
├── file
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   └── service
│
├── sharelink
│   ├── controller
│   ├── entity
│   ├── repository
│   └── service
│
├── storage
│   ├── config
│   └── service
│
└── exception
```

---

## Local Setup

### Clone Repository

```bash
git clone <repository-url>
cd CloudVault
```

### Start Infrastructure

```bash
docker compose up -d
```

Services:

| Service       | Port |
| ------------- | ---- |
| PostgreSQL    | 5433 |
| MinIO API     | 9000 |
| MinIO Console | 9001 |

### Configure Application

Create:

```text
application-local.properties
```

Example:

```properties
spring.datasource.username=postgres
spring.datasource.password=postgres

app.jwt.secret=<your-secret>

minio.access-key=admin
minio.secret-key=password123
```

### Run Application

```bash
./mvnw spring-boot:run
```

---

## API Endpoints

### Authentication

| Method | Endpoint       |
| ------ | -------------- |
| POST   | /auth/register |
| POST   | /auth/login    |

### Files

| Method | Endpoint      |
| ------ | ------------- |
| POST   | /files/upload |
| GET    | /files        |
| GET    | /files/{id}   |
| DELETE | /files/{id}   |

### Sharing

| Method | Endpoint          |
| ------ | ----------------- |
| POST   | /files/{id}/share |
| GET    | /share/{token}    |

---

## Security Features

* JWT Authentication
* Password Hashing with BCrypt
* File Ownership Validation
* Share Link Password Protection
* Share Link Expiration
* Access Control Enforcement

---

## Future Roadmap

### Phase 2

* Redis Caching
* File Metadata Caching
* Download Statistics

### Phase 3

* Kafka Event Processing
* Background Workers
* Thumbnail Generation

### Phase 4

* Elasticsearch Integration
* Full Text Search

### Phase 5

* Microservices Architecture
* API Gateway
* gRPC Communication

### Phase 6

* Observability
* Prometheus
* Grafana
* Distributed Tracing

---

## Learning Goals

CloudVault was built to gain hands-on experience with:

* Backend System Design
* Object Storage
* Authentication & Authorization
* REST API Development
* Dockerized Infrastructure
* Database Design
* Secure File Sharing
* Production-Oriented Backend Architecture

---

## Author

**M. Sai Amirthesh**

Computer Science Student | Backend Engineering | Systems Programming | AI & Cybersecurity
