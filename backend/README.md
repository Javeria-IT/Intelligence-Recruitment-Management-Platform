# Intelligent Recruitment Management Platform — Backend

An AI-powered recruitment/ATS backend built with **Node.js, Express.js, MongoDB (Mongoose)**,
following **MVC architecture**. Includes JWT auth, role-based authorization, resume
upload + AI parsing, AI candidate ranking, interview scheduling with AI-generated
questions, notifications, and admin/recruiter analytics dashboards.

## 1. Folder Structure

```
recruitment-platform/
├── ai/                     # "AI" services: resume parsing, ranking, question generation
│   ├── resumeParser.js
│   ├── aiRanking.js
│   └── questionGenerator.js
├── config/
│   └── db.js               # Mongoose connection
├── controllers/            # Route handlers (business logic)
├── middleware/
│   ├── authMiddleware.js   # JWT verification (protect)
│   ├── roleMiddleware.js   # Role-based authorization (authorize)
│   ├── errorMiddleware.js  # Central error handler + 404
│   ├── uploadMiddleware.js # Multer config for resumes
│   └── validateMiddleware.js
├── models/                 # Mongoose schemas
├── routes/                 # Express routers
├── services/                # Reusable business logic (notifications, ranking)
├── postman/                  # Postman collection + environment for API testing
│   ├── RecruitAI.postman_collection.json
│   └── RecruitAI.postman_environment.json
├── seed/seed.js             # Sample data seeder
├── uploads/resumes/         # Uploaded resume files (local disk storage)
├── utils/                   # Helpers: AppError, catchAsync, apiResponse, generateToken
├── server.js                 # App entry point
├── package.json
└── .env.example
```

## 2. Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# then edit .env: set MONGO_URI and a strong JWT_SECRET

# 3. Make sure MongoDB is running (local or Atlas)

# 4. (Optional) Seed sample data
npm run seed

# 5. Start the server
npm run dev     # with nodemon (development)
# or
npm start        # production
```

The API will be available at `http://localhost:5000`.
Health check: `http://localhost:5000/health`

## 2b. API Testing with Postman

A ready-to-import Postman collection and environment live in the `postman/` folder:

1. Open Postman → **Import** → select both:
   - `postman/RecruitAI.postman_collection.json`
   - `postman/RecruitAI.postman_environment.json`
2. Select the **"RecruitAI - Local"** environment in the top-right dropdown.
3. Run the requests in this order the first time:
   - `Auth → Register - Recruiter`
   - `Auth → Register - Candidate` (and `Candidate 2` if you want a second applicant)
   - `Jobs → Create Job`
   - `Candidate → Upload Resume` (attach a real PDF/DOCX in the `resume` field)
   - `Candidate → Apply to Job`
4. From there, every other request (shortlisting, scheduling interviews, ranking,
   dashboards, admin reports, notifications) will work — tokens and IDs
   (`recruiterToken`, `candidateToken`, `jobId`, `applicationId`, `interviewId`,
   `notificationId`, etc.) are captured automatically by test scripts on the
   register/login/create requests and stored as collection variables, so you
   don't need to copy-paste anything between requests.
5. For the **Admin** folder, run `npm run seed` first (or manually promote a
   user's `role` to `admin` in MongoDB), then use `Auth → Login - Admin`.

## 3. Seeded Demo Accounts

| Role      | Email                      | Password        |
|-----------|-----------------------------|-----------------|
| Admin     | admin@recruitai.com         | Admin@123       |
| Recruiter | recruiter@recruitai.com     | Recruiter@123   |
| Candidate | john@recruitai.com          | Candidate@123   |
| Candidate | jane@recruitai.com          | Candidate@123   |

## 4. Authentication

Send the JWT in the `Authorization` header on protected routes:

```
Authorization: Bearer <token>
```

Tokens are returned from `POST /api/auth/register` and `POST /api/auth/login`.

## 5. Key API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Candidate (role: candidate)
- `GET /api/candidate/profile`
- `PUT /api/candidate/profile`
- `POST /api/candidate/uploadResume` (multipart/form-data, field name: `resume`)
- `GET /api/candidate/jobs`
- `POST /api/candidate/apply/:jobId`
- `GET /api/candidate/applications`

### Jobs (recruiter creates/updates/deletes; any authenticated role can view)
- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `PUT /api/jobs/:id`
- `DELETE /api/jobs/:id`
- `GET /api/jobs/:id/applicants` (AI-ranked, descending by score)

### Recruiter (role: recruiter/admin)
- `POST /api/recruiter/shortlist/:applicationId`
- `PUT /api/recruiter/applications/:applicationId/status`
- `POST /api/recruiter/notify/:candidateId`
- `GET /api/recruiter/dashboard`

### Interview
- `POST /api/interview/schedule`
- `GET /api/interview/:id`
- `PUT /api/interview/:id/answers`
- `PUT /api/interview/:id/feedback`

### Admin (role: admin)
- `GET /api/admin/users`
- `DELETE /api/admin/user/:id`
- `GET /api/admin/jobs`
- `DELETE /api/admin/jobs/:id`
- `GET /api/admin/reports`

### AI
- `POST /api/ai/parseResume` (multipart/form-data, field name: `resume`)
- `POST /api/ai/rankCandidates` (body: `{ "jobId": "..." }`)

### Notifications
- `GET /api/notifications`
- `PUT /api/notifications/read/:id`
- `PUT /api/notifications/read-all`

## 6. AI Candidate Ranking Algorithm

Implemented in `ai/aiRanking.js`. Weighted scoring out of 100:

| Component            | Weight |
|-----------------------|--------|
| Skill Match            | 40%    |
| Experience Match       | 25%    |
| Education Match        | 15%    |
| Certifications         | 10%    |
| Keyword Similarity     | 10%    |

Applications are automatically re-scored when a candidate applies, and
`GET /api/jobs/:id/applicants` / `POST /api/ai/rankCandidates` return
applicants sorted by `AI_score` descending.

## 7. Resume Parsing

`ai/resumeParser.js` extracts text from PDF (`pdf-parse`) and DOCX (`mammoth`)
files, then uses keyword/heuristic matching to extract skills, education,
experience, certifications, email, and phone number. This is intentionally
implementation-swappable — replace the internals with a call to an LLM API
for smarter parsing without changing any controller code.

## 8. Security Measures

- **JWT** authentication with role claims
- **bcryptjs** password hashing (salt rounds: 10)
- **Helmet** for secure HTTP headers
- **CORS** restricted to `CLIENT_URL`
- **express-rate-limit** to throttle abusive traffic
- **express-validator** for input validation on write endpoints
- **express-mongo-sanitize** to strip NoSQL-injection operators from input
- File upload restricted to PDF/DOCX with a configurable max size (Multer)

## 9. Notes for Production

- Swap the local disk storage (Multer) for S3/GCS if deploying to ephemeral hosts.
- Swap `ai/resumeParser.js` and `ai/questionGenerator.js` internals for real
  LLM-backed calls if richer NLP is needed — the function signatures are
  designed to make this a drop-in change.
- Add refresh tokens / token blacklisting if you need immediate revocation.
- Consider adding integration tests (Jest + Supertest) before scaling the team.
