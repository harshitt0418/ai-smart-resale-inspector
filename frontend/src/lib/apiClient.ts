/**
 * lib/apiClient.ts
 *
 * Shared axios instance that points directly at the backend REST API.
 * Base URL is read from NEXT_PUBLIC_API_URL (e.g. http://localhost:5000/api).
 * CORS on the backend already allows http://localhost:3000, so direct
 * browser→backend calls work without a Next.js proxy.
 */

import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
