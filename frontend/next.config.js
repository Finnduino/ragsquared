/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Use environment variable for backend URL, fallback to localhost for development
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      // Only proxy review API endpoints, not the HTML page routes
      // Next.js handles /review/[auditId] pages, Flask only handles API endpoints
      {
        source: '/review/:auditId/final-report',
        destination: `${backendUrl}/review/:auditId/final-report`,
      },
      {
        source: '/review/:auditId/final-report.json',
        destination: `${backendUrl}/review/:auditId/final-report.json`,
      },
      {
        source: '/review/:auditId/final-report.pdf',
        destination: `${backendUrl}/review/:auditId/final-report.pdf`,
      },
      {
        source: '/review/:auditId/final-report.docx',
        destination: `${backendUrl}/review/:auditId/final-report.docx`,
      },
    ];
  },
  // Increase API route timeout for long-running operations (legislation uploads)
  // Note: This is a server-side timeout, Railway may have its own limits
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

module.exports = nextConfig;

