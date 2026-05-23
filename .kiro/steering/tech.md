# Technology Stack

## Framework & Runtime

- **Next.js 14**: App Router with React Server Components
- **React 19**: UI library
- **TypeScript 5**: Type-safe development
- **Node.js**: Server runtime (ES modules)

## Frontend

- **Styling**: Tailwind CSS 3.4 with custom theme
- **UI Components**: Radix UI primitives + shadcn/ui
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **State Management**: React hooks + Context API
- **Wallet Integration**: ethers.js v6

## Backend Services

- **Database**: MongoDB with Mongoose ODM
- **Queue**: BullMQ + Redis (IORedis client)
- **Authentication**: NextAuth.js v4 with MongoDB adapter
- **Blockchain**: ethers.js v6, Hardhat for smart contracts
- **Validation**: Zod schemas
- **Security**: LRU cache for rate limiting

## Smart Contracts

- **Language**: Solidity 0.8.19
- **Framework**: Hardhat 3.0
- **Network**: Polygon (Mumbai testnet for dev)
- **Contract**: LegalFlow.sol (document registration)

## Development Tools

- **Package Manager**: npm
- **TypeScript Compiler**: tsc with strict mode
- **Linting**: ESLint
- **Testing**: Hardhat for smart contracts
- **Process Manager**: tsx for worker processes

## Common Commands

### Development
```bash
npm install              # Install dependencies
npm run dev              # Start Next.js dev server (port 3000)
npm run worker:dev       # Start blockchain worker with hot reload
```

### Production
```bash
npm run build            # Build Next.js application
npm start                # Start production server
npm run worker           # Start blockchain worker
```

### Testing
```bash
npm test                 # Run all tests
npm test validation      # Run specific test suite
cd backend/blockchain && npx hardhat test  # Test smart contracts
```

### Blockchain
```bash
cd backend/blockchain
npx hardhat compile                        # Compile contracts
npx hardhat run scripts/deploy.js --network polygon  # Deploy to Polygon
```

## Build System

- **Build Tool**: Next.js built-in (Turbopack/Webpack)
- **Module System**: ES modules (type: "module" in package.json)
- **Path Aliases**: `@/*` maps to project root
- **Dynamic Routes**: Force dynamic rendering for API routes with `export const dynamic = "force-dynamic"`

## Environment Variables

Required in `.env.local`:
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection URL
- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: Auth secret (min 32 chars)
- `POLYGON_RPC_URL`: Blockchain RPC endpoint
- `BLOCKCHAIN_PRIVATE_KEY`: Wallet private key for transactions
- `CONTRACT_ADDRESS`: Deployed smart contract address
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth credentials

## Architecture Notes

- **Singleton Pattern**: Single Redis/MongoDB connection per process
- **Lazy Initialization**: Connections established only when needed
- **No Build-Time Connections**: Database/Redis connections avoided during build
- **Worker Separation**: Blockchain operations run in separate process
- **Async Queue**: Non-blocking API responses with background processing
