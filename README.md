# RateShield

RateShield is a production-grade distributed rate limiter built with JavaScript, Node.js, Express.js, Redis, MongoDB Atlas, React, and Docker.

---

## 🚀 Current Status: Core Backend Complete

All database-backed modules, validation schemas, key generation algorithms, and multi-algorithm Redis rate limiters are fully implemented, verified, and ready for deployment.

### Current Progress
- [x] Express backend architecture initialized
- [x] Global Request Logger & Security Middlewares (Helmet, CORS)
- [x] Health Check and Live Telemetry Endpoint
- [x] MongoDB database connection with Mongoose
- [x] **User Authentication & Dashboard Access** (JWT, Password hashing)
- [x] **Rate Limit Policy Management** (CRUD endpoints)
- [x] **Secure API Key Management** (SHA-256 hash storage, masking, automatic cache invalidation)
- [x] **Core Distributed Rate Limiter** (Fixed Window, Sliding Window Log, and Token Bucket via atomic Redis Lua scripting)

---

## 📁 Repository Structure

```text
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & database connections
│   │   ├── controllers/     # MVC controller routers
│   │   ├── middleware/      # Auth (JWT) & Rate Limiting middlewares
│   │   ├── models/          # Mongoose database schemas (User, Policy, ApiKey)
│   │   ├── redis/           # Redis connection configuration
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Database operations & rate limiting engines
│   │   ├── utils/           # Cryptographic key generators
│   │   └── validators/      # Payload schema validators
```

---

## 📖 Documentation

Complete, production-grade documentation has been prepared to guide you through testing, deployment, and interview scenarios:

- **Architecture & Cache Strategy**: [docs/APIKey_and_Policy_Architecture.md](file:///d:/RateShield/docs/APIKey_and_Policy_Architecture.md)
- **API Documentation**: [docs/API_Documentation.md](file:///d:/RateShield/docs/API_Documentation.md)
- **End-to-End Testing Guide**: [docs/Testing_Guide.md](file:///d:/RateShield/docs/Testing_Guide.md)
- **Debugging & Common Bugs Guide**: [docs/Common_Bugs_and_Debugging.md](file:///d:/RateShield/docs/Common_Bugs_and_Debugging.md)
- **Production & Scalability Analysis**: [docs/Production_and_Scalability.md](file:///d:/RateShield/docs/Production_and_Scalability.md)
- **Interview Preparation Guide**: [docs/Interview_Preparation.md](file:///d:/RateShield/docs/Interview_Preparation.md)

---

## 🛠️ Quick Start

1. **Configure Environment Variables**:
   Create a `.env` in `backend/` using the `.env.example` template:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://...
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your_jwt_secret_here
   ```

2. **Run Services Locally**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
