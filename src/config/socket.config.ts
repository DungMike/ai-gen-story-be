export const socketConfig = {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.SOCKET_CREDENTIALS === 'true',
  },
  
  namespaces: {
    stories: '/stories',
    audio: '/audio',
    images: '/images',
    batch: '/batch',
    dashboard: '/dashboard',
  },
  
  events: {
    story: {
      processingStart: 'story:processing:start',
      processingProgress: 'story:processing:progress',
      processingComplete: 'story:processing:complete',
      processingError: 'story:processing:error',
    },
    audio: {
      processingStart: 'audio:processing:start',
      processingProgress: 'audio:processing:progress',
      processingComplete: 'audio:processing:complete',
      processingError: 'audio:processing:error',
    },
    image: {
      processingStart: 'image:processing:start',
      processingProgress: 'image:processing:progress',
      processingComplete: 'image:processing:complete',
      processingError: 'image:processing:error',
    },
    batch: {
      processingStart: 'batch:processing:start',
      processingProgress: 'batch:processing:progress',
      processingComplete: 'batch:processing:complete',
      processingError: 'batch:processing:error',
    },
    dashboard: {
      statsUpdate: 'dashboard:stats:update',
      chartUpdate: 'dashboard:chart:update',
      activityUpdate: 'dashboard:activity:update',
    },
  },
}; 