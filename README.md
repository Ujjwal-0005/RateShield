# RateShield

RateShield is a production-grade, distributed rate-limiting backend with MongoDB, Redis, JWT-based dashboard authentication, role-based authorization, policy management, API key management, and a dynamic rate limiter engine.

## Current Repository Layout

- `backend/` contains the Express API, services, models, validators, and Redis integration.
- `frontend/` is still the default Vite React starter and is not yet connected to the backend UI.
- `docs/` contains architecture, testing, debugging, and roadmap documentation.
- `docker-compose.yml` starts Redis and MongoDB services.

---

## Admin Authentication & Authorization Module

RateShield provides enterprise-grade, JWT-based authentication and Role-Based Access Control (RBAC) to protect administrative control plane operations.

### Key Security Features
- **Dual-Token Architecture**: Short-lived Access Tokens (24h) and long-lived, revocable Refresh Tokens (7d).
- **Role-Based Access Control (RBAC)**: Support for `user`, `admin`, and `superadmin` roles.
- **Session Revocation**: Logging out or deactivating an account immediately clears refresh tokens.
- **Password Reset Revocation**: Changing passwords automatically revokes older issued JWTs by verifying token timestamp (`iat`) against `passwordChangedAt`.
- **Password Security**: Passwords are hashed using `bcryptjs` with salt rounds of 10 (`select: false` by default).

### Protected Control Plane Routes
- `/policies`: Admin management of rate-limiting policies.
- `/api-keys`: Admin management of client API key credentials.
- `/metrics`: System performance and rate-limiting telemetry.
- `/auth/me`, `/auth/profile`, `/auth/change-password`, `/auth/logout`, `/auth/deactivate`: Admin user profile and session operations.

---

## Dynamic Rate Limiter Engine

RateShield features a fully dynamic rate-limiting engine. When a client request is received, the rate limiter resolves the client's API key, loads their assigned Policy, selects the appropriate rate limiting algorithm strategy, checks the request quota using atomic Redis operations, and responds with the decision.

### Key Pipeline Stages
1. **API Key Authentication**: Retrieve and authenticate the API key from request headers (`x-api-key`) or query parameters.
2. **Policy Loading**: Retrieve the active policy linked to the API key.
3. **Algorithm Resolution**: Select the rate-limiting algorithm dynamically (Sliding Window, Fixed Window, or Token Bucket).
4. **Redis Execution**: Execute the rate limiting logic atomically using Redis Lua scripts.
5. **Metrics Telemetry**: Update overall request statistics, algorithm usage, average processing time, and active keys in Redis.
6. **Decision & Headers**: Return appropriate rate limit headers and either proceed (`HTTP 200`) or reject (`HTTP 429 Retry-After`).

---

## Supported Rate Limiting Algorithms

1. **Sliding Window Log (Default)**: Tracks precise request timestamps inside a Redis Sorted Set (`ZSET`). Highly accurate; prevents request bursts at window boundaries.
2. **Fixed Window Counter**: Increments a counter for a fixed window epoch in Redis. Memory-efficient; simple to implement.
3. **Token Bucket**: Accumulates tokens in a virtual bucket refilled at a constant rate. Permits burst traffic up to the bucket capacity.

---

## Redis Architecture

- **Atomicity**: Rate-limiting algorithms are written as Redis Lua scripts, guaranteeing thread-safety and avoiding race conditions.
- **Resilience**: Redis connections are resilient with auto-reconnect logic. In case of complete Redis failure, the limiter catches exceptions, increments error counters locally, and fails gracefully.
- **Namespaces**:
  - `apikey:val:<hashedKey>`: Cache for resolved API keys.
  - `rate:sliding:<keyId>`: Sorted sets for sliding window logs.
  - `rate:fixed:<keyId>:<epoch>`: Counters for fixed window limits.
  - `rate:token:<keyId>`: Hashes for token buckets.
  - `metrics:*`: Metrics data structures.

---

## Rate Limiting Headers

Every rate-limited endpoint responds with standard headers:

| Header Name | Type | Description |
| :--- | :--- | :--- |
| `X-RateLimit-Limit` | Integer | Maximum requests allowed in the current window. |
| `X-RateLimit-Remaining` | Integer | Requests remaining in the current window. |
| `X-RateLimit-Reset` | Epoch | Unix timestamp (seconds) when the current window resets. |
| `Retry-After` | Integer | (On HTTP 429) Seconds to wait before retrying. |

---

## Quick Start

### Backend

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `backend/.env` file with at least:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/rateshield
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=change-me
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_SECRET=change-me-refresh
   JWT_REFRESH_EXPIRES_IN=7d
   ```

3. Run the baseline policy seeder:
   ```bash
   npm run seed:policies
   ```

4. Start the backend in development mode:
   ```bash
   npm run dev
   ```

---

## Documentation Directory

Explore the complete documentation for more details:
- [Admin Authentication & RBAC Overview](docs/Authentication.md)
- [Admin Authentication API Specification](docs/Authentication_API.md)
- [Admin Authentication Architecture](docs/Authentication_Architecture.md)
- [Admin Authentication Sequence Flow](docs/Authentication_Flow.md)
- [JWT Dual-Token Strategy](docs/JWT_Strategy.md)
- [Testing Authentication](docs/Authentication_Testing.md)
- [Admin Security & Interview Preparation](docs/Authentication_Interview.md)
- [Dynamic Rate Limiter Overview](docs/RateLimiter.md)
- [Rate Limiter API Guide](docs/RateLimiter_API.md)
- [Rate Limiter Architecture](docs/RateLimiter_Architecture.md)
- [Rate Limiter Execution Flow](docs/RateLimiter_Flow.md)
- [Redis Infrastructure Strategy](docs/RedisStrategy.md)
- [Enforced Rate Limiting Algorithms](docs/Algorithms.md)
- [Testing Rate Limiting Engine](docs/RateLimiter_Testing.md)
- [Distributed Systems & Interview Prep](docs/RateLimiter_Interview.md)
- [Common Bugs and Debugging](docs/Common_Bugs_and_Debugging.md)
