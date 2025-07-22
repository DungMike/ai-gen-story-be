export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    uri: process.env.MONGODB_URI || 
      `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME || 'admin'}:${process.env.MONGO_INITDB_ROOT_PASSWORD || 'password123'}@localhost:${process.env.MONGO_PORT || '27018'}/ai-story-generator?authSource=admin`,
    username: process.env.MONGO_INITDB_ROOT_USERNAME || 'admin',
    password: process.env.MONGO_INITDB_ROOT_PASSWORD || 'password123',
    port: process.env.MONGO_PORT || '27018',
  },
  
  ai: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
    tts: {
      googleApiKey: process.env.GOOGLE_TTS_API_KEY,
      elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
    },
  },
  
  file: {
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['.txt', '.doc', '.docx'],
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  
  socket: {
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.SOCKET_CREDENTIALS === 'true',
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
}); 