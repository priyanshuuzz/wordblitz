# Project Structure

## Directory Organization

```
legalflow/
├── app/                    # Next.js App Router (pages & API routes)
├── backend/                # Server-side services & smart contracts
├── components/             # React components (client-side)
├── hooks/                  # React hooks (client-side)
├── lib/                    # Client-safe utilities
├── workers/                # Background worker processes
├── tests/                  # Test files
└── scripts/                # Utility scripts
```

## App Directory (`app/`)

Next.js 14 App Router structure with pages and API routes.

### Pages
- `app/page.tsx`: Landing page
- `app/dashboard/`: Dashboard pages (documents, analytics, profile, etc.)
- `app/login/`, `app/register/`: Authentication pages
- `app/verify/`: Document verification page

### API Routes (`app/api/`)
Thin controllers that delegate to backend services.

- `app/api/auth/[...nextauth]/`: NextAuth authentication
- `app/api/doc/`: Document operations (register, list, status, verify)
- `app/api/user/`: User management (profile, link/unlink wallet)
- `app/api/queue/`: Queue metrics
- `app/api/upload/`: File upload handling

**Convention**: API routes should be thin controllers. Business logic belongs in `backend/services/`.

## Backend Directory (`backend/`)

Server-side only code. Never imported by client components.

### Services (`backend/services/`)

Organized by domain with clear separation of concerns:

- **`auth/`**: Authentication & authorization
  - `User.model.ts`: User schema and CRUD operations
  - `Organization.model.ts`: Organization schema
  - `OrganizationMember.model.ts`: Membership schema
  - `accessControl.service.ts`: Multi-tenant access control, usage limits
  - `auth.config.ts`: NextAuth configuration

- **`blockchain/`**: Blockchain integration
  - `blockchain.service.ts`: Smart contract interactions (ethers.js v6)
  - `blockchain.utils.ts`: Blockchain utilities

- **`database/`**: Database connection
  - `mongodb.ts`: MongoDB connection with singleton pattern

- **`document/`**: Document management
  - `Document.model.ts`: Document schema and CRUD operations

- **`queue/`**: Background job queue
  - `queue.service.ts`: BullMQ queue management (singleton Redis connection)

- **`security/`**: Security utilities
  - `hash.service.ts`: Server-side SHA-256 hashing
  - `signature.service.ts`: Wallet signature verification
  - `rateLimit.service.ts`: Rate limiting with LRU cache

- **`validation/`**: Input validation
  - `validation.service.ts`: Zod schemas for API validation

### Smart Contracts (`backend/blockchain/`)

- `contracts/LegalFlow.sol`: Solidity smart contract
- `scripts/deploy.js`: Deployment script
- `test/`: Hardhat test files
- `artifacts/`: Compiled contract artifacts (generated)
- `hardhat.config.cjs`: Hardhat configuration (CommonJS)

## Components Directory (`components/`)

React components for UI. Client-side only.

- `components/dashboard-*.tsx`: Dashboard layout components
- `components/smart-editor/`: Document editor components
- `components/auth-context.tsx`: Authentication context provider
- `components/WalletConnect.tsx`: Wallet connection component

**Convention**: Use kebab-case for component files.

## Hooks Directory (`hooks/`)

Custom React hooks for client-side logic.

- `hooks/useWallet.ts`: Wallet connection hook
- Other custom hooks as needed

## Lib Directory (`lib/`)

Client-safe utility functions. Can be imported by both client and server.

- `lib/wallet.ts`: Client-side wallet utilities
- `lib/session-middleware.ts`: Session handling utilities
- `lib/utils.ts`: General utilities (cn helper, etc.)

**Important**: No server-only code (database, blockchain private keys) in `lib/`.

## Workers Directory (`workers/`)

Background worker processes that run separately from the Next.js server.

- `workers/blockchainWorker.ts`: Processes blockchain registration queue
  - Connects to Redis queue
  - Registers documents on blockchain
  - Updates MongoDB with results
  - Handles retries and error recovery

**Run separately**: `npm run worker` or `npm run worker:dev`

## Tests Directory (`tests/`)

Test files for backend services.

- `tests/validation.test.ts`: Validation service tests
- `tests/rateLimit.test.ts`: Rate limiting tests
- `tests/signature.test.ts`: Signature verification tests
- `tests/server-hash.test.ts`: Hash service tests

## Scripts Directory (`scripts/`)

Utility scripts for development and operations.

- `scripts/verify-contract.ts`: Contract verification
- `scripts/check-wallet-balance.ts`: Check wallet balance
- `scripts/test-blockchain.js`: Blockchain testing
- `scripts/pre-flight-check.sh`: Pre-deployment checks

## Code Organization Principles

### Server vs Client Separation

- **Server-only**: `backend/`, `workers/`, API routes
- **Client-safe**: `components/`, `hooks/`, `lib/`
- **Shared**: Type definitions, constants

### Import Conventions

- Use `@/` path alias for imports from project root
- Example: `import { connectToDatabase } from '@/backend/services/database/mongodb'`
- API routes import from `backend/services/`
- Components import from `components/`, `hooks/`, `lib/`

### File Naming

- **Components**: kebab-case (e.g., `dashboard-header.tsx`)
- **Services**: camelCase with suffix (e.g., `blockchain.service.ts`)
- **Models**: PascalCase with suffix (e.g., `User.model.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useWallet.ts`)
- **API Routes**: `route.ts` in directory structure

### Model Pattern

Models export:
1. TypeScript interface (e.g., `IUser`)
2. Mongoose schema
3. Model instance (e.g., `UserModel`)
4. Helper functions (CRUD operations)

### Service Pattern

Services export functions, not classes. Use singleton pattern for connections.

Example:
```typescript
// Singleton connection
let connection: Connection | null = null;

function getConnection() {
  if (!connection) {
    connection = createConnection();
  }
  return connection;
}

export async function doSomething() {
  const conn = getConnection();
  // ... use connection
}
```

### API Route Pattern

```typescript
export const dynamic = "force-dynamic"; // For dynamic routes

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  // 2. Input validation
  // 3. Authentication/authorization
  // 4. Delegate to service
  // 5. Return response
}
```

## Configuration Files

- `.env.local`: Environment variables (not committed)
- `.env.example`: Environment variable template
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `next.config.js`: Next.js configuration
- `backend/blockchain/hardhat.config.cjs`: Hardhat configuration
