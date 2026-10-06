# Intelligence Recruitment Platform – Frontend

A modern, responsive recruitment web application built with **React, TypeScript, Vite, Tailwind CSS, shadcn/ui, and React Query**. The platform connects candidates with recruiters and provides role-based dashboards, job management, applications, interviews, notifications, profile management, OTP verification, and candidate fraud/verification workflows.

## Features

### Authentication & Account Management
- Candidate and recruiter registration
- Login and logout
- OTP verification
- Login-time OTP / 2FA support
- Forgot password flow
- Profile management
- Avatar upload
- Role-based route protection

### Candidate Portal
- Candidate dashboard
- Browse and search job listings
- View job details
- Apply for jobs
- Manage applications
- Save/unsave jobs
- Interview management
- Notifications
- Candidate profile
- Candidate verification settings

### Recruiter Portal
- Recruiter dashboard
- Post and edit jobs
- Manage posted jobs
- View applicants
- Applicant profiles and application information
- Recruiter interview management
- Recruiter notifications
- Recruiter profile and company information

### Verification & Fraud Detection
- Candidate fraud checks
- Fraud reports
- Risk badges and verification cards
- Recruiter fraud-review actions
- Experience/timeline analysis
- Certificate verification
- GitHub verification

## Tech Stack

- **React 18** – UI library
- **TypeScript** – Type-safe development
- **Vite** – Frontend build tool and development server
- **React Router DOM** – Client-side routing
- **TanStack React Query** – Server-state management and API caching
- **Axios** – HTTP requests
- **Tailwind CSS** – Utility-first styling
- **shadcn/ui + Radix UI** – Reusable accessible UI components
- **Lucide React** – Icons
- **React Hook Form + Zod** – Forms and validation
- **Recharts** – Charts and data visualization
- **Sonner** – Toast notifications
- **Vitest + Testing Library** – Testing

## Project Structure

```text
Frontend/
├── public/                  # Static assets
├── src/
│   ├── api/                 # API request functions and React Query hooks
│   ├── components/          # Reusable application components
│   │   ├── candidate/       # Candidate-specific components
│   │   ├── fraud/           # Fraud/verification components
│   │   └── ui/              # shadcn/Radix UI components
│   ├── contexts/            # Global authentication and theme contexts
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # Authentication and dashboard layouts
│   ├── lib/                 # Shared utilities and API configuration
│   ├── pages/
│   │   ├── auth/            # Login, register, OTP and password recovery
│   │   ├── candidate/       # Candidate dashboard pages
│   │   └── recruiter/       # Recruiter dashboard pages
│   ├── test/                # Test setup and tests
│   ├── types/               # TypeScript API/domain types
│   ├── App.tsx              # Application routing and providers
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── .env                     # Local environment variables (do not commit secrets)
├── components.json          # shadcn/ui configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig*.json           # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Prerequisites

Make sure you have the following installed:

- **Node.js** 18+ (Node.js 20+ recommended)
- **npm** or **Bun**
- A running backend/API for the recruitment platform

## Installation

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd Frontend
```

### 2. Install dependencies

Using npm:

```bash
npm install
```

Or using Bun:

```bash
bun install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_API_URL=
```

Replace the API URL with the URL of your backend server.

> **Security:** Never commit passwords, API keys, tokens, or other secrets to GitHub. Keep `.env` local and use `.env.example` for non-secret configuration when needed.

## Run the Development Server

Using npm:

```bash
npm run dev
```

Using Bun:

```bash
bun run dev
```

Vite will display the local development URL, normally:

```text
http://localhost:5173
```

## Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run build:dev` | Create a development-mode build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |
| `npm run test` | Run tests once with Vitest |
| `npm run test:watch` | Run Vitest in watch mode |

## Main Routes

### Public / Authentication

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | User login |
| `/register` | Candidate/recruiter registration |
| `/verify-otp` | OTP verification |
| `/forgot-password` | Password recovery |

### Candidate

| Route | Purpose |
|---|---|
| `/candidate` | Candidate dashboard |
| `/candidate/jobs` | Browse jobs |
| `/candidate/jobs/:id` | Job details |
| `/candidate/applications` | Applications |
| `/candidate/saved` | Saved jobs |
| `/candidate/notifications` | Notifications |
| `/candidate/interviews` | Interviews |
| `/candidate/profile` | Candidate profile |

### Recruiter

| Route | Purpose |
|---|---|
| `/recruiter` | Recruiter dashboard |
| `/recruiter/post` | Post a job |
| `/recruiter/edit/:id` | Edit a job |
| `/recruiter/jobs` | Manage jobs |
| `/recruiter/applicants` | Manage applicants |
| `/recruiter/interviews` | Interviews |
| `/recruiter/notifications` | Notifications |
| `/recruiter/profile` | Recruiter profile |

## API Integration

The frontend communicates with the backend through Axios. API modules are organized under `src/api/`, including:

- Authentication
- Candidate operations
- Recruiter operations
- Jobs
- Applications
- Interviews
- Notifications
- OTP verification
- Certificates
- GitHub verification
- Fraud detection and reporting

The base API URL is configured through:

```env
VITE_API_URL=your-backend-api-url
```

## Authentication Flow

1. User registers or logs in.
2. The frontend receives the authenticated user and token from the backend.
3. The token and user information are stored locally for the active session.
4. OTP verification is required when applicable.
5. Protected candidate/recruiter routes use role-based dashboard access.
6. The frontend validates an existing session against the backend when the application loads.

## Testing

Run the test suite with:

```bash
npm run test
```

For watch mode:

```bash
npm run test:watch
```

## Code Quality

Run ESLint before committing changes:

```bash
npm run lint
```

## Git & GitHub

Before pushing the project, make sure generated files and secrets are ignored. The project already ignores `node_modules`, build output, local environment files, and editor-specific files.

Typical workflow:

```bash
git add .
git commit -m "Update frontend"
git push
```

## Notes

- Do **not** upload the `node_modules` folder to GitHub.
- Do **not** commit `.env` files containing private credentials or tokens.
- The frontend requires the corresponding backend API to be running for authentication, jobs, applications, interviews, notifications, and verification features.
- The project uses Vite path aliases such as `@/components`, `@/lib`, and `@/hooks`.

## Author

**Javeria**

Frontend development for the Intelligence Recruitment Platform.
