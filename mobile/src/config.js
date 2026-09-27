export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://society-operations-suite.onrender.com').replace(/\/$/, '');

// Free Render servers sleep when idle and can take close to a minute to wake up.
export const REQUEST_TIMEOUT_MS = 60000;
