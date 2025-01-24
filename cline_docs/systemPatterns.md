# System Patterns

## Architecture Patterns

### 1. Application Structure
- Next.js 14 App Router architecture
- API routes for backend functionality
- Client-side components for interactivity
- Server-side rendering for initial page loads

### 2. Authentication Flow
- NextAuth.js with GitHub provider
- Session-based authentication
- Protected routes pattern
- OAuth 2.0 flow with GitHub

### 3. Data Management
- MongoDB for persistent storage
- React Query for client-side data management
- API routes for data operations
- Type-safe database operations

### 4. Security Scanning Patterns
- Repository content analysis
- Pattern matching for vulnerabilities
- Historical data tracking
- Scan result aggregation

## Key Technical Decisions

### 1. Next.js App Router
- Chosen for server-side rendering capability
- Built-in API routes
- TypeScript support
- File-based routing

### 2. MongoDB
- Document-based storage for flexible scan results
- Efficient querying for historical data
- Schema-less design for evolving data structures

### 3. TailwindCSS
- Utility-first CSS framework
- Responsive design support
- Consistent styling patterns
- Minimal bundle size

### 4. React Query
- Efficient data fetching
- Cache management
- Real-time updates
- Background data synchronization

### 5. TypeScript
- Type safety across the application
- Better developer experience
- Reduced runtime errors
- Enhanced code maintainability