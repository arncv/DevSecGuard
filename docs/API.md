# DevSecGuard API Documentation

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication

All API endpoints require authentication using NextAuth.js sessions. Requests must include a valid session token.

### Headers
```
Authorization: Bearer {session_token}
Content-Type: application/json
```

## Endpoints

### 1. Security Scan

#### Start New Scan
```http
POST /scan
```

**Request Body**
```json
{
  "repositoryUrl": "https://github.com/username/repo",
  "scanType": "full",
  "options": {
    "includeForks": false,
    "scanDepth": "deep",
    "excludePatterns": ["*.test.js", "*.spec.js"]
  }
}
```

**Response**
```json
{
  "scanId": "507f1f77bcf86cd799439011",
  "status": "initiated",
  "estimatedTime": "120s",
  "timestamp": "2024-01-26T18:30:00Z"
}
```

**Status Codes**
- `201`: Scan initiated successfully
- `400`: Invalid request parameters
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Server error

#### Get Scan Status
```http
GET /scan/{scanId}
```

**Response**
```json
{
  "scanId": "507f1f77bcf86cd799439011",
  "status": "completed",
  "progress": 100,
  "findings": [
    {
      "type": "secret",
      "severity": "high",
      "location": "src/config.js:15",
      "description": "API key exposed in configuration file",
      "snippet": "const apiKey = 'abc123'",
      "recommendation": "Move sensitive data to environment variables"
    }
  ],
  "metadata": {
    "startTime": "2024-01-26T18:30:00Z",
    "endTime": "2024-01-26T18:32:00Z",
    "totalFiles": 156,
    "totalFindings": 3
  }
}
```

### 2. Scan History

#### List Scan History
```http
GET /history
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 10) |
| status | string | Filter by status (completed, failed, pending) |
| severity | string | Filter by finding severity |

**Response**
```json
{
  "scans": [
    {
      "scanId": "507f1f77bcf86cd799439011",
      "repositoryUrl": "https://github.com/username/repo",
      "timestamp": "2024-01-26T18:30:00Z",
      "status": "completed",
      "findingsSummary": {
        "total": 3,
        "high": 1,
        "medium": 2,
        "low": 0
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalScans": 48
  }
}
```

#### Get Detailed Scan Results
```http
GET /history/{scanId}
```

**Response**
```json
{
  "scanId": "507f1f77bcf86cd799439011",
  "repositoryUrl": "https://github.com/username/repo",
  "timestamp": "2024-01-26T18:30:00Z",
  "status": "completed",
  "findings": [
    {
      "id": "finding123",
      "type": "vulnerability",
      "severity": "high",
      "location": {
        "file": "src/api/endpoint.js",
        "line": 45,
        "column": 12
      },
      "description": "SQL Injection vulnerability detected",
      "snippet": "const query = `SELECT * FROM users WHERE id = ${userId}`",
      "recommendation": "Use parameterized queries to prevent SQL injection",
      "references": [
        {
          "title": "OWASP SQL Injection",
          "url": "https://owasp.org/www-community/attacks/SQL_Injection"
        }
      ]
    }
  ],
  "metadata": {
    "scanDuration": "120s",
    "filesScanned": 156,
    "linesOfCode": 15000,
    "scanConfiguration": {
      "type": "full",
      "includeForks": false,
      "excludePatterns": ["*.test.js"]
    }
  }
}
```

### 3. User Settings

#### Get User Settings
```http
GET /settings
```

**Response**
```json
{
  "notifications": {
    "email": true,
    "slack": false,
    "scanComplete": true,
    "highSeverityOnly": true
  },
  "scanPreferences": {
    "defaultScanType": "full",
    "excludePatterns": ["*.test.js", "*.spec.js"],
    "includeForks": false
  },
  "displayPreferences": {
    "theme": "dark",
    "resultsPerPage": 10,
    "defaultSortField": "severity"
  }
}
```

#### Update User Settings
```http
PATCH /settings
```

**Request Body**
```json
{
  "notifications": {
    "email": false,
    "highSeverityOnly": true
  },
  "scanPreferences": {
    "defaultScanType": "quick"
  }
}
```

**Response**
```json
{
  "status": "success",
  "message": "Settings updated successfully"
}
```

## Error Responses

All error responses follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error context"
    }
  }
}
```

### Common Error Codes
- `INVALID_REQUEST`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `RATE_LIMITED`: Too many requests
- `SCAN_ERROR`: Error during scan execution
- `NOT_FOUND`: Resource not found
- `SERVER_ERROR`: Internal server error

## Rate Limiting

- 100 requests per minute per authenticated user
- 5 concurrent scans per user
- Headers included in response:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1706271600
  ```

## Webhooks

### Scan Complete Webhook
```http
POST {webhook_url}
```

**Payload**
```json
{
  "event": "scan.completed",
  "scanId": "507f1f77bcf86cd799439011",
  "timestamp": "2024-01-26T18:32:00Z",
  "status": "completed",
  "summary": {
    "totalFindings": 3,
    "highSeverity": 1,
    "mediumSeverity": 2,
    "lowSeverity": 0
  },
  "repositoryUrl": "https://github.com/username/repo"
}
```

## API Versioning

The API version is included in the response headers:
```
X-API-Version: 1.0
```

Future versions will be available at `/api/v2`, `/api/v3`, etc.