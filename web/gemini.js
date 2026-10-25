/**
 * Google Gemini API Client Module for AIOffice
 * Model: gemini-flash-lite-latest
 */

const GEMINI_STORAGE_KEY = 'aioffice_gemini_api_key';
const DEFAULT_MODEL = 'gemini-flash-lite-latest';

export class GeminiService {
  constructor() {
    this.apiKey = localStorage.getItem(GEMINI_STORAGE_KEY) || '';
    this.model = DEFAULT_MODEL;
  }

  hasApiKey() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getApiKey() {
    return this.apiKey;
  }

  setApiKey(key) {
    this.apiKey = (key || '').trim();
    if (this.apiKey) {
      localStorage.setItem(GEMINI_STORAGE_KEY, this.apiKey);
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  }

  /**
   * Send a prompt with active document context to Gemini API
   * @param {string} prompt - User request
   * @param {object} docContext - { type, title, content }
   * @param {function} onChunk - Callback for streaming chunks
   * @returns {Promise<string>}
   */
  async askGemini(prompt, docContext = null, onChunk = null) {
    if (!this.hasApiKey()) {
      throw new Error('Google Gemini API 키가 설정되지 않았습니다. 상단 [Gemini 키 설정] 버튼을 눌러 키를 등록해 주세요.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    // Build system instructions and context
    let systemPrompt = `당신은 최첨단 문서 오피스 제품군 "AIOffice (AI 오피스)"에 탑재된 스마트 문서 작성 도우미입니다.
사용자의 문서 작성, 서식 편집, 표 채우기, 요약, 문맥 개선, 번역, 슬라이드 기획 등의 요청을 전문적이고 친절하게 지원합니다.
답변은 읽기 쉬운 한국어 마크다운(Markdown) 포맷으로 작성해 주세요.`;

    const userParts = [];

    // Multimodal attachments (e.g. PDF documents, images)
    if (docContext && docContext.base64Data && docContext.mimeType) {
      userParts.push({
        inlineData: {
          mimeType: docContext.mimeType,
          data: docContext.base64Data
        }
      });
    }

    let contextMessage = '';
    if (docContext && docContext.content && !docContext.base64Data) {
      contextMessage = `\n\n[현재 열려 있는 문서 정보]\n- 종류: ${docContext.type}\n- 제목: ${docContext.title}\n- 내용 요약/발췌:\n"""\n${String(docContext.content).slice(0, 8000)}\n"""`;
    } else if (docContext && docContext.title) {
      contextMessage = `\n\n[첨부된 문서 정보]\n- 종류: ${docContext.type}\n- 제목: ${docContext.title}`;
    }

    const fullPrompt = `${contextMessage ? contextMessage + '\n\n' : ''}[사용자 요청]: ${prompt}`;
    userParts.push({ text: fullPrompt });

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: userParts
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 4096
      }
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status} 오류`;
        if (response.status === 400 || response.status === 403) {
          throw new Error(`Gemini API 인증 오류: 키가 올바른지 확인해 주세요. (${errMsg})`);
        } else if (response.status === 429) {
          throw new Error(`요청 한도(Rate Limit) 초과: 잠시 후 다시 시도해 주세요.`);
        }
        throw new Error(`Gemini API 호출 실패: ${errMsg}`);
      }

      const data = await response.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.map(p => p.text).join('') || '응답을 생성할 수 없습니다.';

      if (typeof onChunk === 'function') {
        onChunk(text);
      }

      return text;
    } catch (err) {
      console.error('Gemini API Error:', err);
      throw err;
    }
  }

  /**
   * Test API Key validity
   */
  async testApiKey(key) {
    const testEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(key)}`;
    const testBody = {
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      generationConfig: { maxOutputTokens: 10 }
    };

    const res = await fetch(testEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBody)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `인증 실패 (${res.status})`);
    }

    return true;
  }
}
