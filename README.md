# DevSecGuard

DevSecGuard is a developer security assistant that helps identify potential security vulnerabilities in your code repositories. It scans GitHub repositories for common security issues like exposed secrets, SQL injection vulnerabilities, and XSS patterns.

## Features

- 🔒 **Secret Detection**: Identify exposed API keys, tokens, and credentials
- 🛡️ **Vulnerability Scanning**: Detect SQL injection and XSS vulnerabilities
- 📊 **Scan History**: Track security scans and monitor repository health
- 🔑 **GitHub Integration**: Seamless authentication and repository access
- 📱 **Responsive Design**: Works on desktop and mobile devices

### Enhanced Dashboard Features

- 📈 **Visual Analytics**: 
  - Pie charts showing findings distribution by severity
  - Bar charts displaying findings by type
  - Clear visual indicators for scan status
  - Visual severity score indicators

- 🔍 **Advanced Filtering & Sorting**:
  - Filter by status (Completed, Failed)
  - Filter by severity (Critical, High, Medium, Low)
  - Filter by finding type (Secrets, Vulnerabilities, Code Smells)
  - Sort by date, findings count, or severity score
  - Ascending/descending sort options

- 💡 **Smart Remediation Guidance**:
  - Type-specific remediation advice
  - Clear, actionable recommendations
  - Context-aware security best practices
  - Detailed finding summaries

- 🎯 **Improved User Experience**:
  - Clear status indicators with icons
  - Concise findings summaries
  - Interactive data visualization
  - Enhanced loading and empty states
  - User-friendly error handling

## Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, React Query
- **Authentication**: NextAuth.js with GitHub OAuth
- **Database**: MongoDB
- **Security**: GitHub API, Custom scanning patterns
- **UI Components**: Heroicons, Recharts
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
   - Code quality issues
4. Use dashboard features:
   - Filter and sort findings
   - View visual analytics
   - Get remediation advice
   - Track scan history
5. Monitor security improvements over time

## Security Patterns

DevSecGuard scans for the following security issues:

- **Secrets**: API keys, tokens, and credentials
- **Vulnerabilities**: SQL injection, XSS, and other security vulnerabilities
- **Code Smells**: Code quality issues that might lead to security problems

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
- [ ] Add export functionality for scan results
- [ ] Implement automated remediation suggestions
- [ ] Add custom dashboard widgets
- [ ] Integrate with additional security tools