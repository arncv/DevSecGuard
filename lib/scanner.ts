import { Octokit } from "@octokit/rest";
import { exec } from 'child_process';

export interface ScanResult {
  id: string;
  repositoryUrl: string;
  timestamp: Date;
  findings: Finding[];
  status: 'completed' | 'failed';
  error?: string;
}

export interface Finding {
  type: 'secret' | 'vulnerability' | 'code_smell';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  file: string;
  line: number;
  code?: string;
  severityScore?: number;
  category?: FindingCategory;
}

interface FindingCategory {
  byType: {
    secret: boolean;
    vulnerability: boolean;
    codeSmell: boolean;
  };
  bySeverity: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  byLocation: {
    isSource: boolean;
    isConfig: boolean;
    isTest: boolean;
  };
}

interface RepoContent {
  type: "file" | "dir" | "submodule" | "symlink";
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string | null;
  git_url: string | null;
  download_url: string | null;
  content?: string;
  encoding?: string;
}

// Severity scoring weights
const SEVERITY_WEIGHTS = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 1,
};

// Enhanced security patterns
const SECURITY_PATTERNS = {
  secrets: {
    apiKeys: /(?:api[_-]?key|aws[_-]?key|secret[_-]?key|token)["\s]*[:=]\s*["']?[A-Za-z0-9+/]{32,}["']?/i,
    credentials: /(?:password|passwd|pwd)["\s]*[:=]\s*["']?[^"'\s]+["']?/i,
    privateKeys: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
  },
  injection: {
    sql: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\s+.*?\s+FROM\s+[^\s;]+/i,
    nosql: /\$where\s*:\s*function\s*\(.*\)|db\.eval\(|mapReduce|group|aggregate/i,
  },
  xss: {
    basic: /(?:<script\b[^>]*>[\s\S]*?<\/script>|javascript:|\bon[a-z]+\s*=)/i,
    advanced: /(?:eval\(|setTimeout\(|setInterval\(|new Function\()/i,
  },
};

// False positive patterns
const FALSE_POSITIVE_PATTERNS = {
  testFiles: /\.(test|spec)\.(js|ts|jsx|tsx)$/i,
  mockData: /(mock|fake|dummy|test).*\.(json|js|ts)$/i,
  exampleCode: /example|demo|sample/i,
};

export async function scanRepository(url: string, accessToken: string): Promise<ScanResult> {
  const octokit = new Octokit({
    auth: accessToken,
  });

  try {
    // Extract owner and repo from URL
    const [owner, repo] = url
      .replace("https://github.com/", "")
      .replace(".git", "")
      .split("/");

    // Get repository contents
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: "",
    });

    const findings: Finding[] = [];

    // Recursively scan files
    await scanFiles(octokit, owner, repo, Array.isArray(contents) ? contents : [contents] as RepoContent[], findings);

    // Run enhanced security scans
    await Promise.all([
      integrateGitleaks(owner, repo, findings),
      scanDependencies(owner, repo, findings),
      scanAdditionalPatterns(owner, repo, findings),
      scanGitHistory(owner, repo, findings),
    ]);

    // Post-process findings
    findings.forEach(calculateSeverityScore);
    findings.forEach(categorizeFinding);
    const validFindings = removeFalsePositives(findings);

    return {
      id: new Date().getTime().toString(),
      repositoryUrl: url,
      timestamp: new Date(),
      findings: validFindings,
      status: 'completed',
    };
  } catch (error) {
    return {
      id: new Date().getTime().toString(),
      repositoryUrl: url,
      timestamp: new Date(),
      findings: [],
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

async function scanFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  contents: RepoContent[],
  findings: Finding[]
) {
  for (const item of contents) {
    if (item.type === "file") {
      // Skip binary files and certain extensions
      if (shouldSkipFile(item.name)) continue;

      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: item.path,
      }) as { data: RepoContent };

      if ('content' in data && typeof data.content === 'string') {
        const content = Buffer.from(data.content, 'base64').toString();
        scanContent(content, item.path, findings);
      }
    } else if (item.type === "dir") {
      const { data: dirContents } = await octokit.repos.getContent({
        owner,
        repo,
        path: item.path,
      });

      await scanFiles(
        octokit,
        owner,
        repo,
        Array.isArray(dirContents) ? dirContents : [dirContents] as RepoContent[],
        findings
      );
    }
  }
}

function shouldSkipFile(filename: string): boolean {
  const skipExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
    '.ttf', '.woff', '.woff2', '.eot',
    '.pdf', '.zip', '.tar', '.gz',
    '.mp3', '.mp4', '.avi', '.mov',
  ];
  return skipExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

function calculateSeverityScore(finding: Finding) {
  const baseScore = SEVERITY_WEIGHTS[finding.severity];
  let contextualScore = 0;

  // Add points for sensitive file contexts
  if (finding.file.includes('auth') || finding.file.includes('security')) {
    contextualScore += 2;
  }
  if (finding.file.includes('api') || finding.file.includes('endpoint')) {
    contextualScore += 1;
  }

  finding.severityScore = baseScore + contextualScore;
}

function removeFalsePositives(findings: Finding[]): Finding[] {
  return findings.filter(finding => {
    // Skip test and mock files
    if (FALSE_POSITIVE_PATTERNS.testFiles.test(finding.file) || 
        FALSE_POSITIVE_PATTERNS.mockData.test(finding.file) ||
        FALSE_POSITIVE_PATTERNS.exampleCode.test(finding.file)) {
      return false;
    }
    return true;
  });
}

function categorizeFinding(finding: Finding) {
  finding.category = {
    byType: {
      secret: finding.type === 'secret',
      vulnerability: finding.type === 'vulnerability',
      codeSmell: finding.type === 'code_smell',
    },
    bySeverity: {
      critical: finding.severity === 'critical',
      high: finding.severity === 'high',
      medium: finding.severity === 'medium',
      low: finding.severity === 'low',
    },
    byLocation: {
      isSource: finding.file.endsWith('.ts') || finding.file.endsWith('.js'),
      isConfig: finding.file.includes('config') || finding.file.endsWith('.json'),
      isTest: finding.file.includes('.test.') || finding.file.includes('.spec.'),
    },
  };
}

function extractContext(content: string, lineNumber: number, contextLines: number = 3): string {
  const lines = content.split('\n');
  const start = Math.max(0, lineNumber - contextLines - 1);
  const end = Math.min(lines.length, lineNumber + contextLines);
  return lines.slice(start, end).join('\n');
}

function scanContent(content: string, filepath: string, findings: Finding[]) {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for secrets
    Object.entries(SECURITY_PATTERNS.secrets).forEach(([type, pattern]) => {
      if (pattern.test(line)) {
        findings.push({
          type: 'secret',
          severity: 'critical',
          description: `Potential ${type} found`,
          file: filepath,
          line: index + 1,
          code: extractContext(content, index + 1),
        });
      }
    });

    // Check for injection vulnerabilities
    Object.entries(SECURITY_PATTERNS.injection).forEach(([type, pattern]) => {
      if (pattern.test(line)) {
        findings.push({
          type: 'vulnerability',
          severity: 'high',
          description: `Potential ${type} injection vulnerability`,
          file: filepath,
          line: index + 1,
          code: extractContext(content, index + 1),
        });
      }
    });

    // Check for XSS vulnerabilities
    Object.entries(SECURITY_PATTERNS.xss).forEach(([type, pattern]) => {
      if (pattern.test(line)) {
        findings.push({
          type: 'vulnerability',
          severity: 'high',
          description: `Potential ${type} XSS vulnerability`,
          file: filepath,
          line: index + 1,
          code: extractContext(content, index + 1),
        });
      }
    });
  });
}

async function integrateGitleaks(owner: string, repo: string, findings: Finding[]): Promise<void> {
  return new Promise((resolve) => {
    exec(`gitleaks detect --repo-url https://github.com/${owner}/${repo} --no-git --format json`, (error, stdout) => {
      if (!error && stdout) {
        try {
          const results = JSON.parse(stdout);
          results.forEach((result: any) => {
            findings.push({
              type: 'secret',
              severity: 'critical',
              description: `Gitleaks: ${result.description}`,
              file: result.file,
              line: result.lineNumber,
              code: extractContext(result.content, result.lineNumber),
            });
          });
        } catch (e) {
          console.error('Failed to parse Gitleaks results:', e);
        }
      }
      resolve();
    });
  });
}

async function scanDependencies(owner: string, repo: string, findings: Finding[]): Promise<void> {
  return new Promise((resolve) => {
    exec('yarn audit --json', (error, stdout) => {
      if (!error && stdout) {
        try {
          const results = JSON.parse(stdout);
          results.forEach((result: any) => {
            findings.push({
              type: 'vulnerability',
              severity: result.level === 'critical' ? 'critical' : 'high',
              description: `Dependency: ${result.title}`,
              file: 'package.json',
              line: 1,
              code: `Package: ${result.module_name}@${result.version}`,
            });
          });
        } catch (e) {
          console.error('Failed to parse dependency scan results:', e);
        }
      }
      resolve();
    });
  });
}

async function scanAdditionalPatterns(owner: string, repo: string, findings: Finding[]): Promise<void> {
  return Promise.resolve(); // Placeholder for future pattern implementations
}

async function scanGitHistory(owner: string, repo: string, findings: Finding[]): Promise<void> {
  return new Promise((resolve) => {
    exec(`git log -p`, (error, stdout) => {
      if (!error && stdout) {
        const lines = stdout.split('\n');
        lines.forEach((line, index) => {
          Object.entries(SECURITY_PATTERNS.secrets).forEach(([type, pattern]) => {
            if (pattern.test(line)) {
              findings.push({
                type: 'secret',
                severity: 'critical',
                description: `Historical ${type} found in Git history`,
                file: 'Git History',
                line: index + 1,
                code: extractContext(stdout, index + 1),
              });
            }
          });
        });
      }
      resolve();
    });
  });
}

// Export utilities for use in other components
export {
  calculateSeverityScore,
  removeFalsePositives,
  extractContext,
  categorizeFinding,
  SEVERITY_WEIGHTS,
  FALSE_POSITIVE_PATTERNS,
  SECURITY_PATTERNS,
};