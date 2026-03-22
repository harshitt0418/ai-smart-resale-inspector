/**
 * Axios instance pre-configured with the backend base URL.
 * All API calls across the app import from this file.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
