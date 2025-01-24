# DevSecGuard

DevSecGuard is a developer security assistant that helps identify potential security vulnerabilities in your code repositories. It scans GitHub repositories for common security issues like exposed secrets, SQL injection vulnerabilities, and XSS patterns.

## Features

- 🔒 **Secret Detection**: Identify exposed API keys, tokens, and credentials
- 🛡️ **Vulnerability Scanning**: Detect SQL injection and XSS vulnerabilities
- 📊 **Scan History**: Track security scans and monitor repository health
- 🔑 **GitHub Integration**: Seamless authentication and repository access
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, React Query
- **Authentication**: NextAuth.js with GitHub OAuth
- **Database**: MongoDB
- **Security**: GitHub API, Custom scanning patterns
- **Deployment**: Ready for Vercel deployment

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env.local`:
   ```
   GITHUB_ID=your_github_oauth_app_id
   GITHUB_SECRET=your_github_oauth_app_secret
   NEXTAUTH_URL=http://localhost:3001
   NEXTAUTH_SECRET=your-nextauth-secret-key-at-least-32-chars
   MONGODB_URI=your_mongodb_connection_string
   ```

4. Create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set the callback URL to `http://localhost:3001/api/auth/callback/github`
   - Copy the Client ID and Client Secret to your `.env.local`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3001](http://localhost:3001) in your browser

## Usage

1. Sign in with your GitHub account
2. Enter a GitHub repository URL to scan
3. View detailed scan results including:
   - Potential secrets and API keys
   - SQL injection vulnerabilities
   - XSS vulnerabilities
4. Track scan history and monitor security improvements

## Security Patterns

DevSecGuard scans for the following security issues:

- **Secrets**: API keys, tokens, and credentials
- **SQL Injection**: Vulnerable SQL query patterns
- **XSS**: Cross-site scripting vulnerabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this project as a starting point for your own security tools.

## Future Improvements

- [ ] Add dependency vulnerability scanning
- [ ] Implement real-time scanning with webhooks
- [ ] Add custom scanning patterns configuration
- [ ] Integrate with CI/CD pipelines
- [ ] Add team collaboration features
- [ ] Expand vulnerability detection patterns