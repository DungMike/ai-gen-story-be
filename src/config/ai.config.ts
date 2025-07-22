export const MODELS = {
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GEMINI_2_5_FLASH_PREVIEW_04_17: 'gemini-2.5-flash-preview-04-17',
  GEMINI_2_5_FLASH_LITE_PREVIEW_06_17: 'gemini-2.5-flash-lite-preview-06-17',
}
export const aiConfig = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: MODELS.GEMINI_2_5_FLASH,
    temperature: 0.7,
  },
  
  tts: {
    google: {
      apiKey: process.env.GEMINI_API_KEY,
      voice: 'vi-VN-Standard-A',
      language: 'vi-VN',
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Default voice
      modelId: 'eleven_multilingual_v2',
    },
  },
  
  image: {
    model: 'gemini-1.5-flash',
    size: '1024x1024',
    quality: 'standard',
    style: 'realistic',
  },
}; 


