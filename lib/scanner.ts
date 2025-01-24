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
  confidence: 'low' | 'medium' | 'high';
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

type FileTypeKey = 'FRONTEND' | 'BACKEND' | 'STYLE' | 'CONFIG' | 'TEST';

interface FileTypeConfig {
  type: string;
  extensions: string[];
  vulnerabilities: string[];
}

// Define file types and their extensions
const FILE_TYPES: Record<FileTypeKey, FileTypeConfig> = {
  FRONTEND: {
    type: 'frontend',
    extensions: ['.html', '.js', '.jsx', '.ts', '.tsx', '.vue'],
    vulnerabilities: ['xss', 'clientSideValidation'],
  },
  BACKEND: {
    type: 'backend',
    extensions: ['.js', '.ts', '.py', '.rb', '.php', '.java'],
    vulnerabilities: ['sqlInjection', 'nosqlInjection', 'commandInjection'],
  },
  STYLE: {
    type: 'style',
    extensions: ['.css', '.scss', '.less', '.sass'],
    vulnerabilities: [], // Style files typically don't have direct security vulnerabilities
  },
  CONFIG: {
    type: 'config',
    extensions: ['.json', '.yml', '.yaml', '.env', '.config'],
    vulnerabilities: ['secrets'],
  },
  TEST: {
    type: 'test',
    extensions: ['.test.js', '.spec.js', '.test.ts', '.spec.ts'],
    vulnerabilities: [], // Test files are typically ignored for vulnerability scanning
  },
};

// Define vulnerability patterns with context rules
const VULNERABILITY_PATTERNS = {
  sqlInjection: {
    patterns: [
      {
        regex: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\s+.*?\s+FROM\s+[^\s;]+/i,
        contextRules: [
          (line: string) => !line.includes('?') && !line.includes('$'), // No parameterization
          (line: string) => !line.includes('prepared'), // No prepared statements
        ],
        confidence: (matches: boolean[]) => matches.every(m => m) ? 'high' : 'low',
      },
    ],
    allowedFileTypes: ['backend'],
  },
  nosqlInjection: {
    patterns: [
      {
        regex: /\$where\s*:\s*function\s*\(.*\)|db\.eval\(|mapReduce|group|aggregate/i,
        contextRules: [
          (line: string) => line.includes('mongoose') || line.includes('mongodb'),
          (line: string) => !line.includes('validate'),
        ],
        confidence: (matches: boolean[]) => matches.every(m => m) ? 'high' : 'medium',
      },
    ],
    allowedFileTypes: ['backend'],
  },
  xss: {
    patterns: [
      {
        regex: /(?:<script\b[^>]*>[\s\S]*?<\/script>|javascript:|\bon[a-z]+\s*=)/i,
        contextRules: [
          (line: string) => !line.includes('sanitize') && !line.includes('escape'),
          (line: string) => !line.includes('DOMPurify'),
        ],
        confidence: (matches: boolean[]) => matches.every(m => m) ? 'high' : 'medium',
      },
    ],
    allowedFileTypes: ['frontend'],
  },
  secrets: {
    patterns: [
      {
        regex: /(?:api[_-]?key|aws[_-]?key|secret[_-]?key|token)["\s]*[:=]\s*["']?[A-Za-z0-9+/]{32,}["']?/i,
        contextRules: [
          (line: string) => !line.includes('example') && !line.includes('test'),
          (line: string) => !line.includes('dummy') && !line.includes('sample'),
        ],
        confidence: (matches: boolean[]) => matches.every(m => m) ? 'high' : 'medium',
      },
    ],
    allowedFileTypes: ['config', 'backend'],
  },
};

// Severity scoring weights
const SEVERITY_WEIGHTS = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 1,
};

function getFileType(filename: string): string | null {
  // Check for test files first
  if (Object.values(FILE_TYPES.TEST.extensions).some(ext => filename.endsWith(ext))) {
    return FILE_TYPES.TEST.type;
  }

  // Check other file types
  for (const [key, value] of Object.entries(FILE_TYPES)) {
    if (key in FILE_TYPES && value.extensions.some(ext => filename.toLowerCase().endsWith(ext))) {
      return value.type;
    }
  }

  return null;
}

function categorizeFinding(finding: Finding) {
  finding.category = {
    byType: {
      secret: finding.type === 'secret',
      vulnerability: finding.type === 'vulnerability',
      codeSmell: finding.type === 'code_smell',
    },
    byLocation: {
      isSource: finding.file.endsWith('.js') || finding.file.endsWith('.ts'),
      isConfig: finding.file.includes('config') || finding.file.endsWith('.json'),
      isTest: finding.file.includes('.test.') || finding.file.includes('.spec.'),
    },
  };
}

function isVulnerabilityRelevantForFile(vulnType: string, fileType: string): boolean {
  const key = fileType.toUpperCase() as FileTypeKey;
  if (!(key in FILE_TYPES)) {
    return false;
  }
  const fileTypeConfig = FILE_TYPES[key];
  return fileTypeConfig.vulnerabilities.includes(vulnType);
}

export async function scanRepository(url: string, accessToken: string): Promise<ScanResult> {
  const octokit = new Octokit({
    auth: accessToken,
  });

  try {
    const [owner, repo] = url
      .replace("https://github.com/", "")
      .replace(".git", "")
      .split("/");

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
        const fileType = getFileType(item.path);
        
        if (fileType) {
          scanContent(content, item.path, fileType, findings);
        }
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
    // Skip low confidence findings unless they're critical
    if (finding.confidence === 'low' && finding.severity !== 'critical') {
      return false;
    }

    // Skip findings in test or example files
    if (finding.file.includes('.test.') || 
        finding.file.includes('.spec.') || 
        finding.file.includes('example') || 
        finding.file.includes('sample')) {
      return false;
    }

    return true;
  });
}

function extractContext(content: string, lineNumber: number, contextLines: number = 3): string {
  const lines = content.split('\n');
  const start = Math.max(0, lineNumber - contextLines - 1);
  const end = Math.min(lines.length, lineNumber + contextLines);
  return lines.slice(start, end).join('\n');
}

function scanContent(content: string, filepath: string, fileType: string, findings: Finding[]) {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check each vulnerability type
    Object.entries(VULNERABILITY_PATTERNS).forEach(([vulnType, config]) => {
      // Skip if vulnerability type is not relevant for this file type
      if (!isVulnerabilityRelevantForFile(vulnType, fileType)) return;

      config.patterns.forEach(pattern => {
        if (pattern.regex.test(line)) {
          // Apply context rules
          const contextMatches = pattern.contextRules.map(rule => rule(line));
          const confidence = pattern.confidence(contextMatches);

          // Only add finding if confidence is not low or if it's a critical vulnerability
          if (confidence !== 'low' || vulnType === 'secrets') {
            findings.push({
              type: vulnType === 'secrets' ? 'secret' : 'vulnerability',
              severity: vulnType === 'secrets' ? 'critical' : 'high',
              description: `Potential ${vulnType} found`,
              file: filepath,
              line: index + 1,
              code: extractContext(content, index + 1),
              confidence,
              category: {
                byType: {
                  secret: vulnType === 'secrets',
                  vulnerability: vulnType !== 'secrets',
                  codeSmell: false,
                },
                byLocation: {
                  isSource: fileType === FILE_TYPES.FRONTEND.type || fileType === FILE_TYPES.BACKEND.type,
                  isConfig: fileType === FILE_TYPES.CONFIG.type,
                  isTest: fileType === FILE_TYPES.TEST.type,
                },
              },
            });
          }
        }
      });
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
              confidence: 'high',
              category: ({
                byType: {
                  secret: true,
                  vulnerability: false,
                  codeSmell: false
                },
                byLocation: {
                  isSource: false,
                  isConfig: true,
                  isTest: false
                }
              } as FindingCategory),
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
              confidence: 'high',
              category: {
                byType: {
                  secret: false,
                  vulnerability: true,
                  codeSmell: false,
                },
                byLocation: {
                  isSource: false,
                  isConfig: true,
                  isTest: false,
                },
              },
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

// Export utilities for use in other components
export {
  calculateSeverityScore,
  removeFalsePositives,
  extractContext,
  SEVERITY_WEIGHTS,
  VULNERABILITY_PATTERNS,
  FILE_TYPES,
};