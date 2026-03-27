
'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

interface FeedbackItem {
  lineNumber: number;
  message: string;
  severity: 'suggestion' | 'warning' | 'error';
}

interface ReviewResult {
  reviewId: string;
  status: string;
  feedback: FeedbackItem[];
  originalCode: string;
}

export default function CodeReviewPage() {
  const [code, setCode] = useState<string>('');
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setReviewResult(null);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data: ReviewResult = await response.json();
      setReviewResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch review results.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: FeedbackItem['severity']) => {
    switch (severity) {
      case 'suggestion':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Code Review AI</h1>

        <div className="mb-6">
          <label htmlFor="code-input" className="block text-sm font-medium text-gray-700 mb-2">
            Paste your code here:
          </label>
          <textarea
            id="code-input"
            className="w-full p-4 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-gray-50 resize-y min-h-[200px]"
            rows={10}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste your code here..."
          ></textarea>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? 
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          : 
          'Submit for Review'}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {reviewResult && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Review Results</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
              <p className="text-sm text-gray-600">Review ID: <span className="font-mono text-gray-800">{reviewResult.reviewId}</span></p>
              <p className="text-sm text-gray-600">Status: <span className="font-semibold text-gray-800 capitalize">{reviewResult.status}</span></p>
            </div>

            {reviewResult.feedback.length > 0 ? (
              <ul className="space-y-3">
                {reviewResult.feedback.map((item, index) => (
                  <li key={index} className={`p-4 rounded-md ${getSeverityColor(item.severity)}`}>
                    <p className="font-semibold text-sm mb-1">
                      Line {item.lineNumber}:
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        item.severity === 'suggestion' ? 'bg-blue-200 text-blue-900' :
                        item.severity === 'warning' ? 'bg-yellow-200 text-yellow-900' :
                        'bg-red-200 text-red-900'
                      }`}>
                        {item.severity}
                      </span>
                    </p>
                    <p className="text-sm">{item.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
                <p className="font-medium">No issues found!</p>
                <p className="text-sm">Your code looks great based on our current checks.</p>
              </div>
            )}

            <div className="mt-6 bg-gray-800 rounded-md p-4">
              <h3 className="text-xl font-semibold text-white mb-3">Original Code Submitted</h3>
              <pre className="text-white text-sm overflow-x-auto p-3 bg-gray-900 rounded-md">
                <code>{reviewResult.originalCode}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
