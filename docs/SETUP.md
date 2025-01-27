# DevSecGuard Setup Guide

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- MongoDB Atlas account
- GitHub account (for OAuth setup)

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/devsecguard.git
cd devsecguard
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env.local` file in the project root with the following variables:

```env
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-key-at-least-32-chars
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=<app>
```

## MongoDB Atlas Configuration

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Set up a new cluster:
   - Choose your preferred cloud provider
   - Select your region
   - Choose cluster tier (M0 Free tier is sufficient for development)

3. Database Access Setup:
   ```
   a. Navigate to Security > Database Access
   b. Add new database user
   c. Select password authentication
   d. Grant read/write permissions
   ```

4. Network Access Configuration:
   ```
   a. Go to Security > Network Access
   b. Add IP Address
   c. Allow access from your development machine's IP
   d. Optionally allow access from all (0.0.0.0/0) for development
   ```

5. Obtain Connection String:
   ```
   a. Click 'Connect' on your cluster
   b. Choose 'Connect your application'
   c. Copy the connection string
   d. Replace <password> with your database user's password
   ```

## GitHub OAuth Configuration

1. Create OAuth Application:
   ```
   a. Go to GitHub Settings > Developer settings > OAuth Apps
   b. Click 'New OAuth App'
   c. Fill in application details:
      - Application name: DevSecGuard Local
      - Homepage URL: http://localhost:3001
      - Authorization callback URL: http://localhost:3001/api/auth/callback/github
   ```

2. Configure OAuth Credentials:
   ```
   a. Copy Client ID and Client Secret
   b. Add them to your .env.local file as GITHUB_ID and GITHUB_SECRET
   ```

## Development Server

1. Start the development server:
```bash
npm run dev
```

2. Access the application:
```
Open http://localhost:3001 in your browser
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

## Troubleshooting

### Database Connection Issues
1. Verify MongoDB URI format
2. Check IP whitelist in MongoDB Atlas
3. Ensure proper TLS/SSL configuration
4. Run database connection test:
```bash
node test-db.js
```

### GitHub Authentication Issues
1. Verify OAuth callback URL matches exactly
2. Check environment variables
3. Ensure GitHub OAuth app is properly configured