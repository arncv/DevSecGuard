import { Octokit } from "@octokit/rest";

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

// Common patterns to detect potential security issues
const SECURITY_PATTERNS = {
  secretKeys: /(?:api[_-]?key|aws[_-]?key|secret[_-]?key|token)["\s]*[:=]\s*["']?[A-Za-z0-9+/]{32,}["']?/i,
  sqlInjection: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\s+.*?\s+FROM\s+[^\s;]+/i,
  xss: /(?:<script\b[^>]*>[\s\S]*?<\/script>|javascript:|\bon[a-z]+\s*=)/i,
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

    return {
      id: new Date().getTime().toString(),
      repositoryUrl: url,
      timestamp: new Date(),
      findings,
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

function scanContent(content: string, filepath: string, findings: Finding[]) {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for potential secrets
    if (SECURITY_PATTERNS.secretKeys.test(line)) {
      findings.push({
        type: 'secret',
        severity: 'critical',
        description: 'Potential API key or secret found',
        file: filepath,
        line: index + 1,
        code: line.trim(),
      });
    }

    // Check for SQL injection vulnerabilities
    if (SECURITY_PATTERNS.sqlInjection.test(line)) {
      findings.push({
        type: 'vulnerability',
        severity: 'high',
        description: 'Potential SQL injection vulnerability',
        file: filepath,
        line: index + 1,
        code: line.trim(),
      });
    }

    // Check for XSS vulnerabilities
    if (SECURITY_PATTERNS.xss.test(line)) {
      findings.push({
        type: 'vulnerability',
        severity: 'high',
        description: 'Potential XSS vulnerability',
        file: filepath,
        line: index + 1,
        code: line.trim(),
      });
    }
  });
}