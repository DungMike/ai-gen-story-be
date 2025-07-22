import { MongooseModuleOptions } from '@nestjs/mongoose';

export const databaseConfig: MongooseModuleOptions = {
  uri: process.env.MONGODB_URI || 
    `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME || 'admin'}:${process.env.MONGO_INITDB_ROOT_PASSWORD || 'password123'}@localhost:${process.env.MONGO_PORT || '27018'}/ai-story-generator?authSource=admin`,
}; 