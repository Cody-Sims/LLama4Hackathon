/**
 * Utility functions for language detection and handling
 */

/**
 * Common language codes and their full names
 */
export const LANGUAGE_NAMES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'bn': 'Bengali',
  'pa': 'Punjabi',
  'te': 'Telugu',
  'mr': 'Marathi',
  'ta': 'Tamil',
  'ur': 'Urdu',
  'gu': 'Gujarati',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'tr': 'Turkish',
  'pl': 'Polish',
  'uk': 'Ukrainian',
  'cs': 'Czech',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'da': 'Danish',
  'id': 'Indonesian',
  'ms': 'Malay',
  'he': 'Hebrew',
  'fa': 'Persian',
  'el': 'Greek',
  'ro': 'Romanian',
  'hu': 'Hungarian',
  'sk': 'Slovak',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sr': 'Serbian',
  'sl': 'Slovenian',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'et': 'Estonian',
  'is': 'Icelandic',
  'ga': 'Irish',
  'cy': 'Welsh',
  'mt': 'Maltese',
  'eu': 'Basque',
  'ca': 'Catalan',
  'gl': 'Galician',
  'ast': 'Asturian',
  'oc': 'Occitan',
  'la': 'Latin',
  'sw': 'Swahili',
  'zu': 'Zulu',
  'xh': 'Xhosa',
  'af': 'Afrikaans',
  'am': 'Amharic',
  'hy': 'Armenian',
  'az': 'Azerbaijani',
  'be': 'Belarusian',
  'bs': 'Bosnian',
  'my': 'Burmese',
  'ceb': 'Cebuano',
  'ny': 'Chichewa',
  'eo': 'Esperanto',
  'tl': 'Filipino',
  'fy': 'Frisian',
  'gd': 'Gaelic',
  'ka': 'Georgian',
  'ha': 'Hausa',
  'hmn': 'Hmong',
  'ig': 'Igbo',
  'jw': 'Javanese',
  'kk': 'Kazakh',
  'km': 'Khmer',
  'ku': 'Kurdish',
  'ky': 'Kyrgyz',
  'lo': 'Lao',
  'lb': 'Luxembourgish',
  'mg': 'Malagasy',
  'mi': 'Maori',
  'mk': 'Macedonian',
  'mn': 'Mongolian',
  'ne': 'Nepali',
  'ps': 'Pashto',
  'si': 'Sinhala',
  'so': 'Somali',
  'st': 'Sesotho',
  'su': 'Sundanese',
  'tg': 'Tajik',
  'uz': 'Uzbek',
  'yi': 'Yiddish',
  'yo': 'Yoruba',
  'auto': 'Auto-detect'
};

/**
 * Detects the language of a text using common patterns and words
 * This is a simple implementation - for production, consider using a proper language detection library
 * @param {string} text - The text to detect language from
 * @returns {string} - The detected language code or 'en' if detection fails
 */
export const detectLanguage = (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return 'en'; // Default to English for empty text
  }
  
  // Normalize text for better detection
  const normalizedText = text.toLowerCase().trim();
  
  // Common words and patterns for different languages
  const languagePatterns = {
    'en': ['the', 'and', 'is', 'in', 'to', 'it', 'that', 'for', 'you', 'with'],
    'es': ['el', 'la', 'los', 'las', 'y', 'es', 'en', 'que', 'por', 'para'],
    'fr': ['le', 'la', 'les', 'et', 'est', 'en', 'que', 'pour', 'dans', 'un'],
    'de': ['der', 'die', 'das', 'und', 'ist', 'in', 'zu', 'den', 'mit', 'für'],
    'it': ['il', 'la', 'i', 'le', 'e', 'è', 'in', 'che', 'per', 'un'],
    'pt': ['o', 'a', 'os', 'as', 'e', 'é', 'em', 'que', 'para', 'um'],
    'nl': ['de', 'het', 'een', 'en', 'is', 'in', 'te', 'dat', 'van', 'voor'],
    'ru': ['и', 'в', 'на', 'что', 'с', 'не', 'я', 'это', 'быть', 'он'],
    'zh': ['的', '是', '不', '了', '在', '人', '有', '我', '他', '这'],
    'ja': ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'も'],
    'ko': ['이', '는', '을', '가', '에', '의', '로', '하다', '을', '것'],
    'ar': ['في', 'من', 'على', 'إلى', 'هو', 'هي', 'أن', 'مع', 'لا', 'كان'],
    'hi': ['का', 'के', 'में', 'है', 'की', 'और', 'को', 'से', 'पर', 'एक']
  };
  
  // Count matches for each language
  const matches = {};
  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    matches[lang] = 0;
    for (const pattern of patterns) {
      // Count how many times this pattern appears in the text
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const count = (normalizedText.match(regex) || []).length;
      matches[lang] += count;
    }
  }
  
  // Find the language with the most matches
  let bestMatch = 'en';
  let maxMatches = 0;
  for (const [lang, count] of Object.entries(matches)) {
    if (count > maxMatches) {
      maxMatches = count;
      bestMatch = lang;
    }
  }
  
  // If no good matches, default to English
  return maxMatches > 0 ? bestMatch : 'en';
};

/**
 * Gets the instruction for generating descriptions in a specific language
 * @param {string} langCode - The language code
 * @returns {string} - The language-specific instruction
 */
export const getLanguageInstruction = (langCode) => {
  const langName = LANGUAGE_NAMES[langCode] || 'the same language as the transcript';
  
  return `Generate the description in ${langName}. Make sure your response is in ${langName} only.`;
};

/**
 * Gets a greeting in the specified language
 * @param {string} langCode - The language code
 * @returns {string} - A greeting in the specified language
 */
export const getGreeting = (langCode) => {
  const greetings = {
    'en': 'Hello! I will describe this video in English.',
    'es': '¡Hola! Describiré este video en español.',
    'fr': 'Bonjour ! Je vais décrire cette vidéo en français.',
    'de': 'Hallo! Ich werde dieses Video auf Deutsch beschreiben.',
    'it': 'Ciao! Descriverò questo video in italiano.',
    'pt': 'Olá! Vou descrever este vídeo em português.',
    'nl': 'Hallo! Ik zal deze video in het Nederlands beschrijven.',
    'ru': 'Привет! Я опишу это видео на русском языке.',
    'zh': '你好！我将用中文描述这个视频。',
    'ja': 'こんにちは！このビデオを日本語で説明します。',
    'ko': '안녕하세요! 이 비디오를 한국어로 설명하겠습니다.',
    'ar': 'مرحبا! سأصف هذا الفيديو باللغة العربية.',
    'hi': 'नमस्ते! मैं इस वीडियो को हिंदी में वर्णन करूंगा।'
  };
  
  return greetings[langCode] || greetings['en'];
};