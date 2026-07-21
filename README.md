# RateShield

RateShield is a Node.js rate-limiting backend with MongoDB, Redis, JWT-based dashboard authentication, policy management, API key management, and Redis-backed request limiting.

## Current Repository Layout

- `backend/` contains the Express API, services, models, validators, and Redis integration.
- `frontend/` is still the default Vite React starter and is not yet connected to the backend UI.
- `docs/` contains architecture, testing, debugging, and roadmap documentation.
- `docker-compose.yml` currently starts Redis only.

## Backend Features

- JWT auth for dashboard routes.
- Policy management endpoints with create, list, search, update, activate, deactivate, and delete.
- API key creation, listing, and revocation.
- API key hashing and masking.
- Redis cache resolution for API keys.
- Fixed window, sliding window, and token bucket rate-limiting logic.
- Health and metrics endpoints.

## Policy Management Module

The policy module is the source of truth for all rate-limiter decisions. Every API key references exactly one policy, and the limiter reads the policy values instead of using hardcoded limits.

### Available Endpoints

- `GET /policies`
- `POST /policies`
- `GET /policies/:id`
- `PUT /policies/:id`
- `PATCH /policies/:id/activate`
- `PATCH /policies/:id/deactivate`
- `DELETE /policies/:id`

### Seeder

Run the baseline policy seeder with:

```bash
cd backend
npm run seed:policies
```

It safely upserts the Free, Premium, and Enterprise policies.

### Future Integration

- Admin dashboard policy management UI
- API key assignment by tier
- Usage analytics by policy
- Policy-aware alerting and billing tiers

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
   ```

3. Start the backend:
   ```bash
   npm run dev
   ```

### Redis

Start Redis with Docker Compose:

```bash
docker compose up -d redis
```

## Documentation

- [Project Architecture](docs/ProjectArchitecture.md)
- [Current Project Status](docs/CurrentProjectStatus.md)
- [Repository Structure](docs/RepositoryStructure.md)
- [Development Roadmap](docs/DevelopmentRoadmap.md)
- [API Documentation](docs/API_Documentation.md)
- [Testing Guide](docs/Testing_Guide.md)
- [Policy Management](docs/PolicyManagement.md)
- [Policy Management API](docs/PolicyManagement_API.md)
- [Policy Management Architecture](docs/PolicyManagement_Architecture.md)
- [Policy Management Flow](docs/PolicyManagement_Flow.md)
- [Policy Management Testing](docs/PolicyManagement_Testing.md)
- [Policy Management Interview Notes](docs/PolicyManagement_Interview.md)
- [Common Bugs and Debugging](docs/Common_Bugs_and_Debugging.md)

## Notes

- The backend uses CommonJS modules.
- The backend config now validates required environment variables at startup.
- Expired API keys are rechecked when served from Redis cache.
- The project does not currently include a root-level package manifest or a `docker/` directory.
