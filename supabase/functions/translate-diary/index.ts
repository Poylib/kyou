/**
 * Supabase Edge Function: translate-diary
 * 
 * Translates Korean diary text to Japanese using Google Gemini API.
 * Returns translation, vocabulary, and grammar point.
 * 
 * Environment Variables (set via Supabase Secrets):
 * - GEMINI_API_KEY: Google AI API key
 * 
 * Usage:
 * POST /functions/v1/translate-diary
 * Body: { text: string, level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Vocabulary item structure
interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
  example: string;
  example_meaning: string;
}

// Grammar point structure
interface GrammarPoint {
  pattern: string;
  title: string;
  explanation: string;
  korean_explanation: string;
  examples: Array<{ japanese: string; korean: string }>;
}

// Response structure
interface TranslationResponse {
  translated_text: string;
  vocabulary: VocabularyItem[];
  grammar_point: GrammarPoint;
}

// Level descriptions for prompt
const levelDescriptions: Record<string, string> = {
  N5: '가장 기초적인 일본어. 히라가나, 가타카나, 기본 한자(약 100자). 간단한 문장 구조만 사용.',
  N4: '기본적인 일본어. 일상 대화 수준. 기본 한자(약 300자). 조금 더 복잡한 문법 구조.',
  N3: '중급 일본어. 일상적인 상황에서 자연스러운 일본어. 한자(약 650자). 다양한 문법 표현.',
  N2: '중상급 일본어. 신문, 뉴스 이해 수준. 한자(약 1000자). 복잡한 문법과 관용 표현.',
  N1: '상급 일본어. 논리적이고 추상적인 글. 한자(약 2000자). 고급 문법과 뉘앙스 표현.',
};

/**
 * Build the translation prompt based on level
 */
function buildPrompt(text: string, level: string): string {
  const levelDesc = levelDescriptions[level] || levelDescriptions['N4'];
  
  return `당신은 한국어-일본어 번역 전문가이자 일본어 교육자입니다.
사용자의 한국어 일기를 JLPT ${level} 수준에 맞는 자연스러운 일본어로 번역해주세요.

## JLPT ${level} 레벨 설명
${levelDesc}

## 번역 규칙
1. ${level} 수준에 맞는 어휘와 문법만 사용하세요.
2. 일기체(~だ, ~た 등)로 자연스럽게 번역하세요.
3. 원문의 감정과 뉘앙스를 잘 살려주세요.
4. 너무 딱딱하지 않게, 실제 일본인이 쓰는 것처럼 번역하세요.

## 요청 내용
다음 한국어 일기를 번역하고, 학습 자료를 추출해주세요:

"""
${text}
"""

## 응답 형식 (반드시 아래 JSON 형식으로만 응답하세요)
{
  "translated_text": "번역된 일본어 텍스트",
  "vocabulary": [
    {
      "word": "한자 또는 단어",
      "reading": "히라가나 읽기",
      "meaning": "한국어 뜻",
      "example": "예문 (일본어)",
      "example_meaning": "예문 뜻 (한국어)"
    }
  ],
  "grammar_point": {
    "pattern": "문법 패턴 (예: 〜てみる)",
    "title": "한국어 제목 (예: ~해보다)",
    "explanation": "일본어로 된 문법 설명",
    "korean_explanation": "한국어로 된 문법 설명",
    "examples": [
      { "japanese": "예문1", "korean": "번역1" },
      { "japanese": "예문2", "korean": "번역2" }
    ]
  }
}

## 중요 사항
- vocabulary는 번역문에서 가장 유용한 단어 3개를 선택하세요.
- grammar_point는 번역문에 사용된 가장 중요한 문법 1개를 선택하세요.
- 반드시 유효한 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;
}

/**
 * Parse Gemini response to extract JSON
 */
function parseGeminiResponse(responseText: string): TranslationResponse {
  // Try to extract JSON from the response
  let jsonStr = responseText.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  
  jsonStr = jsonStr.trim();
  
  try {
    const parsed = JSON.parse(jsonStr);
    
    // Validate required fields
    if (!parsed.translated_text || !parsed.vocabulary || !parsed.grammar_point) {
      throw new Error('Missing required fields in response');
    }
    
    return {
      translated_text: parsed.translated_text,
      vocabulary: parsed.vocabulary.slice(0, 3), // Ensure max 3 items
      grammar_point: parsed.grammar_point,
    };
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    console.error('Raw response:', responseText);
    throw new Error('Failed to parse AI response');
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { text, level } = await req.json();

    // Validate input
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!level || !['N5', 'N4', 'N3', 'N2', 'N1'].includes(level)) {
      return new Response(
        JSON.stringify({ error: 'Valid level (N5-N1) is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get API key from environment
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // Build prompt and generate content
    const prompt = buildPrompt(text, level);
    
    console.log('Generating translation for level:', level);
    console.log('Text length:', text.length);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    console.log('Gemini response received');

    // Parse the response
    const translationResult = parseGeminiResponse(responseText);

    // Return successful response
    return new Response(
      JSON.stringify(translationResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in translate-diary function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

