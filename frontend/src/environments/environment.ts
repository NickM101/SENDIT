export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  frontendUrl: 'http://localhost:4200',
  appName: 'SwiftWheels',
  version: '1.0.0',
  maxImageUpload: 10,
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxImageSize: 5 * 1024 * 1024, // 5MB
  features: {
    enableAnalytics: false,
    enableErrorReporting: false,
    enablePerformanceMonitoring: false,
  },
  auth: {
    tokenKey: 'swiftwheels_token',
    refreshTokenKey: 'swiftwheels_refresh_token',
  },
  cache: {
    vehiclesCacheDuration: 5 * 60 * 1000, // 5 minutes
    categoriesCacheDuration: 30 * 60 * 1000, // 30 minutes
  },
  nominatim: {
    baseUrl: 'https://nominatim.openstreetmap.org',
    countryCode: 'ke',
    language: 'en',
  },
  map: {
    defaultCenter: [-1.2921, 36.8219], // Nairobi
    defaultZoom: 7,
    maxZoom: 18,
    minZoom: 6,
  },
};
