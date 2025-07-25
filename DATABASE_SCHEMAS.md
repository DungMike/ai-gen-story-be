# Database Schemas - MongoDB

## 📊 Collection Schemas

### 1. Users Collection

```javascript
// users collection
{
  _id: ObjectId,
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  avatar: {
    type: String,
    trim: true,
    maxlength: 255
  },
  role: {
    type: String,
    enum: ['user', 'premium', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0,
    min: 0
  },
  preferences: {
    language: {
      type: String,
      default: 'vi-VN'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  subscription: {
    planType: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### 2. UserSessions Collection

```javascript
// userSessions collection
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'Users',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    maxlength: 255
  },
  refreshToken: {
    type: String,
    required: true,
    unique: true,
    maxlength: 255
  },
  deviceInfo: {
    device: {
      type: String,
      maxlength: 100
    },
    os: {
      type: String,
      maxlength: 50
    },
    browser: {
      type: String,
      maxlength: 50
    },
    version: {
      type: String,
      maxlength: 20
    }
  },
  ipAddress: {
    type: String,
    maxlength: 45
  },
  userAgent: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

### 3. Stories Collection

```javascript
// stories collection
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'Users',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  originalContent: {
    type: String,
    required: true,
    maxlength: 2000000 // 1MB limit
  },
  generatedContent: {
    type: String,
    default: null,
    maxlength: 2000000 // 2MB limit
  },
  customPrompt: {
    type: String,
    maxlength: 2000
  },
  style: {
    genre: {
      type: String,
      enum: ['fantasy', 'romance', 'action', 'mystery', 'sci-fi', 'horror', 'comedy', 'drama'],
      default: 'fantasy'
    },
    tone: {
      type: String,
      enum: ['dramatic', 'humorous', 'serious', 'romantic', 'mysterious', 'lighthearted'],
      default: 'dramatic'
    },
    length: {
      type: String,
      enum: ['short', 'medium', 'long'],
      default: 'medium'
    },
    targetAudience: {
      type: String,
      enum: ['children', 'teen', 'adult'],
      default: 'teen'
    }
  },
  status: {
    storyGenerated: {
      type: Boolean,
      default: false
    },
    audioGenerated: {
      type: Boolean,
      default: false
    },
    imagesGenerated: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    originalWordCount: {
      type: Number,
      default: 0
    },
    generatedWordCount: {
      type: Number,
      default: 0
    },
    processingTime: {
      type: Number,
      default: 0
    },
    aiModel: {
      type: String,
      default: 'gemini'
    }
  },
  files: {
    originalFile: {
      type: String,
      required: true
    },
    generatedFile: {
      type: String,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### 4. AudioChunks Collection

```javascript
// audioChunks collection
{
  _id: ObjectId,
  storyId: {
    type: ObjectId,
    ref: 'Stories',
    required: true,
    index: true
  },
  chunkIndex: {
    type: Number,
    required: true,
    min: 0
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  audioFile: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  wordCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  metadata: {
    voiceModel: {
      type: String,
      enum: ['google-tts', 'elevenlabs'],
      default: 'google-tts'
    },
    language: {
      type: String,
      default: 'vi-VN'
    },
    processingTime: {
      type: Number,
      default: 0
    },
    voiceSettings: {
      speed: {
        type: Number,
        default: 1.0,
        min: 0.5,
        max: 2.0
      },
      pitch: {
        type: Number,
        default: 0,
        min: -20,
        max: 20
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

### 5. ImageChunks Collection

```javascript
// imageChunks collection
{
  _id: ObjectId,
  storyId: {
    type: ObjectId,
    ref: 'Stories',
    required: true,
    index: true
  },
  chunkIndex: {
    type: Number,
    required: true,
    min: 0
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  imageFile: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  style: {
    artStyle: {
      type: String,
      enum: ['realistic', 'anime', 'comic', 'watercolor', 'oil-painting', 'digital-art'],
      default: 'realistic'
    },
    characterDescription: {
      type: String,
      maxlength: 500
    },
    backgroundDescription: {
      type: String,
      maxlength: 500
    }
  },
  metadata: {
    aiModel: {
      type: String,
      enum: ['gemini', 'dalle-3', 'midjourney'],
      default: 'gemini'
    },
    imageSize: {
      type: String,
      enum: ['512x512', '1024x1024', '1024x768', '768x1024'],
      default: '1024x1024'
    },
    processingTime: {
      type: Number,
      default: 0
    },
    quality: {
      type: String,
      enum: ['standard', 'hd'],
      default: 'standard'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

### 6. BatchJobs Collection

```javascript
// batchJobs collection
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'Users',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  totalFiles: {
    type: Number,
    required: true,
    min: 1
  },
  processedFiles: {
    type: Number,
    default: 0,
    min: 0
  },
  failedFiles: {
    type: Number,
    default: 0,
    min: 0
  },
  settings: {
    autoMode: {
      type: Boolean,
      default: true
    },
    generateAudio: {
      type: Boolean,
      default: true
    },
    generateImages: {
      type: Boolean,
      default: true
    },
    defaultPrompt: {
      type: String,
      maxlength: 2000
    },
    audioSettings: {
      maxWordsPerChunk: {
        type: Number,
        default: 100,
        min: 50,
        max: 200
      },
      voiceModel: {
        type: String,
        enum: ['google-tts', 'elevenlabs'],
        default: 'google-tts'
      }
    },
    imageSettings: {
      artStyle: {
        type: String,
        enum: ['realistic', 'anime', 'comic', 'watercolor'],
        default: 'realistic'
      },
      imageSize: {
        type: String,
        enum: ['512x512', '1024x1024'],
        default: '1024x1024'
      }
    }
  },
  results: [{
    originalFile: {
      type: String,
      required: true
    },
    storyId: {
      type: ObjectId,
      ref: 'Stories'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    error: {
      type: String
    },
    processingTime: {
      type: Number,
      default: 0
    }
  }],
  progress: {
    currentFile: {
      type: Number,
      default: 0
    },
    currentStep: {
      type: String,
      enum: ['story', 'audio', 'images'],
      default: 'story'
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}
```

## 🔍 Database Indexes

### Users Collection Indexes
```javascript
// Primary index on _id (automatic)
// Index for username and email lookups
db.users.createIndex({ 
  "username": 1 
});

db.users.createIndex({ 
  "email": 1 
});

// Index for role-based queries
db.users.createIndex({ 
  "role": 1, 
  "status": 1 
});

// Index for status monitoring
db.users.createIndex({ 
  "status": 1, 
  "createdAt": -1 
});

// Index for login tracking
db.users.createIndex({ 
  "lastLoginAt": -1 
});
```

### UserSessions Collection Indexes
```javascript
// Index for user relationship
db.userSessions.createIndex({ 
  "userId": 1, 
  "isActive": 1 
});

// Index for token lookups
db.userSessions.createIndex({ 
  "token": 1 
});

db.userSessions.createIndex({ 
  "refreshToken": 1 
});

// Index for session management
db.userSessions.createIndex({ 
  "isActive": 1, 
  "expiresAt": 1 
});

// Index for cleanup queries
db.userSessions.createIndex({ 
  "createdAt": -1 
});
```

### Stories Collection Indexes
```javascript
// Index for user relationship
db.stories.createIndex({ 
  "userId": 1, 
  "createdAt": -1 
});

// Compound index for efficient queries
db.stories.createIndex({ 
  "userId": 1,
  "status.storyGenerated": 1, 
  "createdAt": -1 
});

// Index for search by title
db.stories.createIndex({ 
  "title": "text" 
});

// Index for filtering by style
db.stories.createIndex({ 
  "style.genre": 1, 
  "style.tone": 1 
});
```

### AudioChunks Collection Indexes
```javascript
// Index for story relationship
db.audioChunks.createIndex({ 
  "storyId": 1, 
  "chunkIndex": 1 
});

// Index for status queries
db.audioChunks.createIndex({ 
  "status": 1 
});
```

### ImageChunks Collection Indexes
```javascript
// Index for story relationship
db.imageChunks.createIndex({ 
  "storyId": 1, 
  "chunkIndex": 1 
});

// Index for status queries
db.imageChunks.createIndex({ 
  "status": 1 
});
```

### BatchJobs Collection Indexes
```javascript
// Index for user queries
db.batchJobs.createIndex({ 
  "userId": 1, 
  "createdAt": -1 
});

// Index for status monitoring
db.batchJobs.createIndex({ 
  "status": 1, 
  "createdAt": -1 
});
```

## 📊 Data Relationships

### One-to-Many Relationships
```
Users (1) ←→ (Many) Stories
Users (1) ←→ (Many) UserSessions
Users (1) ←→ (Many) BatchJobs
Stories (1) ←→ (Many) AudioChunks
Stories (1) ←→ (Many) ImageChunks
BatchJobs (1) ←→ (Many) Stories (via results array)
```

### Query Examples

#### Get User with Stories and Sessions
```javascript
db.users.aggregate([
  { $match: { _id: ObjectId("userId") } },
  {
    $lookup: {
      from: "stories",
      localField: "_id",
      foreignField: "userId",
      as: "stories"
    }
  },
  {
    $lookup: {
      from: "userSessions",
      localField: "_id",
      foreignField: "userId",
      as: "sessions"
    }
  },
  {
    $addFields: {
      stories: { $sortArray: { input: "$stories", sortBy: { createdAt: -1 } } },
      activeSessions: {
        $filter: {
          input: "$sessions",
          cond: { $eq: ["$$this.isActive", true] }
        }
      }
    }
  }
]);
```

#### Get Story with Audio and Images
```javascript
db.stories.aggregate([
  { $match: { _id: ObjectId("storyId") } },
  {
    $lookup: {
      from: "audioChunks",
      localField: "_id",
      foreignField: "storyId",
      as: "audioChunks"
    }
  },
  {
    $lookup: {
      from: "imageChunks",
      localField: "_id",
      foreignField: "storyId",
      as: "imageChunks"
    }
  },
  {
    $addFields: {
      audioChunks: { $sortArray: { input: "$audioChunks", sortBy: { chunkIndex: 1 } } },
      imageChunks: { $sortArray: { input: "$imageChunks", sortBy: { chunkIndex: 1 } } }
    }
  }
]);
```

#### Get Batch Job Progress
```javascript
db.batchJobs.aggregate([
  { $match: { _id: ObjectId("jobId") } },
  {
    $addFields: {
      completedResults: {
        $size: {
          $filter: {
            input: "$results",
            cond: { $eq: ["$$this.status", "completed"] }
          }
        }
      },
      failedResults: {
        $size: {
          $filter: {
            input: "$results",
            cond: { $eq: ["$$this.status", "failed"] }
          }
        }
      }
    }
  }
]);
```

#### Get User Dashboard Stats
```javascript
db.stories.aggregate([
  { $match: { userId: ObjectId("userId") } },
  {
    $group: {
      _id: null,
      totalStories: { $sum: 1 },
      completedStories: {
        $sum: {
          $cond: [
            { $eq: ["$status.storyGenerated", true] },
            1,
            0
          ]
        }
      },
      totalAudioFiles: {
        $sum: {
          $cond: [
            { $eq: ["$status.audioGenerated", true] },
            1,
            0
          ]
        }
      },
      totalImages: {
        $sum: {
          $cond: [
            { $eq: ["$status.imagesGenerated", true] },
            1,
            0
          ]
        }
      }
    }
  }
]);
```

## 🔄 Data Validation Rules

### Users Validation
- Username must be between 1-50 characters and unique
- Email must be valid format and unique
- Password must be at least 6 characters
- Full name must be between 1-100 characters
- Role must be valid enum value
- Status must be valid enum value

### UserSessions Validation
- UserId must reference existing user
- Token must be unique and not empty
- RefreshToken must be unique and not empty
- ExpiresAt must be a valid date
- IsActive must be boolean

### Stories Validation
- UserId must reference existing user
- Title must be between 1-200 characters
- Original content must not exceed 1MB
- Generated content must not exceed 2MB
- Style enums must be valid values
- Status booleans must be true/false

### AudioChunks Validation
- StoryId must reference existing story
- ChunkIndex must be non-negative
- Content must not exceed 5000 characters
- Duration must be non-negative
- Status must be valid enum value

### ImageChunks Validation
- StoryId must reference existing story
- ChunkIndex must be non-negative
- Content must not exceed 2000 characters
- Prompt must not exceed 1000 characters
- Status must be valid enum value

### BatchJobs Validation
- UserId must reference existing user
- TotalFiles must be at least 1
- ProcessedFiles and FailedFiles must be non-negative
- Progress percentage must be between 0-100

## 🔐 Security Considerations

### 1. User Data Protection
- Passwords are hashed using bcrypt with salt rounds of 12
- Sensitive user data is encrypted at rest
- User sessions are tracked and can be revoked
- Account status management (active, inactive, banned)

### 2. Session Management
- JWT tokens with short expiration (15 minutes)
- Refresh tokens with longer expiration (7 days)
- Session tracking with device information
- Automatic session cleanup for expired tokens

### 3. Data Access Control
- User-specific data isolation
- Role-based access control
- API rate limiting per user
- Input validation and sanitization

### 4. Audit Trail
- User login tracking
- Session creation and termination
- File upload and processing logs
- Error tracking and monitoring 