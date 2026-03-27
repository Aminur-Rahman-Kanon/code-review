
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL!});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body.code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request body. "code" field is required and must be a string.' },
        { status: 400 }
      );
    }

    const { code } = body;

    const prompt = `Review the following code for bugs, security vulnerabilities, and performance issues. Provide your feedback in a JSON array format, where each item has 'lineNumber' (number), 'message' (string), and 'severity' (string: \'suggestion\', \'warning\', or \'error\'). If no issues are found, return an empty array.

Code:
\`\`\`
${code}
\`\`\`

JSON Feedback:
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const response = await result.response.text();
    let text = response.trim();

    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    }
    else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    let feedback: any[] = [];
    try {
      feedback = JSON.parse(text);
      if (!Array.isArray(feedback)) {
        throw new Error('Gemini response was not a JSON array.');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', text, parseError);
      // If parsing fails, return a generic error or log the raw response for debugging
      return NextResponse.json(
        { error: 'Failed to get structured review from AI. Raw response: ' + text.substring(0, 200) + '...' },
        { status: 500 }
      );
    }

    const reviewResult = {
      reviewId: `gemini-review-${Date.now()}`,
      status: 'completed',
      feedback: feedback.map(item => ({
        lineNumber: item.lineNumber,
        message: item.message,
        severity: item.severity,
      })),
      originalCode: code,
    };

    return NextResponse.json(reviewResult, { status: 200 });
  } catch (error) {
    console.error('Error processing code review request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
