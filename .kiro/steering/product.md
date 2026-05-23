# Product Overview

LegalFlow is a document blockchain registration platform that enables secure, tamper-proof document verification using blockchain technology.

## Core Functionality

- **Document Registration**: Upload documents and register their cryptographic hashes on the Polygon blockchain
- **Async Processing**: Background queue system (BullMQ + Redis) handles blockchain transactions asynchronously
- **Multi-Tenant Architecture**: Organization-based access control with role-based permissions (owner, admin, member, viewer)
- **Usage Limits**: Tiered plans (free, pro, enterprise) with configurable document registration limits
- **Wallet Integration**: Support for wallet-based authentication and signature verification
- **Document Verification**: Query blockchain to verify document authenticity and ownership

## Key Features

- Server-side SHA-256 hashing for security
- Wallet signature verification for document registration
- Rate limiting (10 req/min per IP)
- Transaction tracking and status monitoring
- Gas-optimized blockchain operations on Polygon network

## User Flow

1. User authenticates (NextAuth with Google OAuth or wallet)
2. User uploads document through dashboard
3. System computes hash server-side and queues blockchain registration
4. Background worker processes queue and registers on blockchain
5. User can track status and verify documents via blockchain
