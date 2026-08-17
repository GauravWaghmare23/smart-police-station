export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
export const SOCKET_URL = API_URL.replace('/api', '');

// NOTE: Android Google Maps API Key.
// For production release builds, restrict this key in Google Cloud Console by Android package name & SHA-1 fingerprint.
export const GOOGLE_MAPS_API_KEY = 'AIzaSyDCFRlFR8-AjV0rfpDuE56zt46w7R7GddQ';
