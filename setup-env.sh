#!/bin/bash

# Setup environment variables for AI Story Generator Backend

echo "Setting up environment variables for AI Story Generator Backend..."

# Check if .env file already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Do you want to overwrite it? (y/n)"
    read -r response
    if [[ "$response" != "y" && "$response" != "Y" ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Create .env file from example
cp env.example .env

echo "✅ Environment file created: .env"
echo ""
echo "📝 Please update the following variables in .env:"
echo "   - GEMINI_API_KEY: Your Google Gemini API key"
echo "   - GOOGLE_TTS_API_KEY: Your Google Text-to-Speech API key (optional)"
echo "   - ELEVENLABS_API_KEY: Your ElevenLabs API key (optional)"
echo "   - JWT_SECRET: A secure random string for JWT tokens"
echo ""
echo "🔧 Default MongoDB credentials:"
echo "   - Username: admin"
echo "   - Password: password123"
echo ""
echo "🚀 To start the application:"
echo "   1. Start MongoDB: docker-compose up -d"
echo "   2. Install dependencies: npm install"
echo "   3. Start the server: npm run start:dev"
echo ""
echo "📚 API Documentation will be available at: http://localhost:3001/api/docs" 