# Technical Context

## Technologies Used

### Frontend
- Next.js 14 (React framework)
- TailwindCSS (Styling)
- React Query (@tanstack/react-query)
- Chart.js with react-chartjs-2 (Visualizations)

### Backend
- Next.js API Routes
- MongoDB (Database)
- NextAuth.js (Authentication)
- Octokit REST (@octokit/rest for GitHub API)

### Development
- TypeScript
- ESLint
- Autoprefixer
- PostCSS

## Development Setup
1. Environment Variables Required:
   ```
   GITHUB_ID=github_oauth_app_id
   GITHUB_SECRET=github_oauth_app_secret
   NEXTAUTH_URL=http://localhost:3001
   NEXTAUTH_SECRET=nextauth-secret-key
   MONGODB_URI=mongodb_connection_string
   ```

2. GitHub OAuth Setup:
   - OAuth App registration required
   - Callback URL: http://localhost:3001/api/auth/callback/github

3. Development Commands:
   ```bash
   npm install    # Install dependencies
   npm run dev    # Start development server
   npm run build  # Build for production
   npm run start  # Start production server
   npm run lint   # Run linting
   ```

## Technical Constraints
1. Requires GitHub authentication for repository access
2. MongoDB connection required for storing scan history
3. Node.js runtime environment
4. TypeScript strict mode enabled
5. Responsive design requirements for mobile compatibility