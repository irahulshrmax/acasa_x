// app/debug-blogs/page.tsx
"use client";

import { useState, useEffect } from 'react';

export default function DebugBlogsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const addLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = data ? `${timestamp} - ${message} ${JSON.stringify(data, null, 2)}` : `${timestamp} - ${message}`;
    setLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const testFetch = async (url: string, options?: RequestInit) => {
    setLoading(true);
    addLog(`🚀 Testing: ${url}`);
    
    try {
      const startTime = Date.now();
      addLog(`⏱️ Request started at: ${new Date().toISOString()}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...(options?.headers || {}),
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      addLog(`📡 Response status: ${response.status} ${response.statusText}`);
      addLog(`📡 Response duration: ${duration}ms`);
      addLog(`📡 Response headers:`, Object.fromEntries(response.headers));
      
      // Try to read response as text first
      const text = await response.text();
      addLog(`📄 Raw response (first 500 chars): ${text.substring(0, 500)}`);
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(text);
        addLog(`✅ JSON parsed successfully`);
        addLog(`✅ Response data:`, json);
        setResult(json);
        return json;
      } catch (parseError: any) {
        addLog(`❌ Failed to parse JSON: ${parseError.message}`);
        addLog(`❌ Raw response: ${text}`);
        setResult({ error: 'Failed to parse JSON', raw: text });
        throw parseError;
      }
      
    } catch (error: any) {
      addLog(`❌ Fetch error: ${error.message}`);
      addLog(`❌ Error name: ${error.name}`);
      addLog(`❌ Error stack: ${error.stack}`);
      setResult({ error: error.message, stack: error.stack });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setLogs([]);
    setResult(null);
    addLog('🧪 Starting all tests...');

    // Test 1: Basic fetch with no params
    await testFetch('/api/v1/blogs');

    // Test 2: With limit param
    await testFetch('/api/v1/blogs?limit=5');

    // Test 3: With status param
    await testFetch('/api/v1/blogs?status=1');

    // Test 4: With featured param
    await testFetch('/api/v1/blogs?featured=true');

    // Test 5: Test with AbortController (timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      addLog('⏱️ Testing with 5s timeout...');
      await testFetch('/api/v1/blogs?limit=3', { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (error: any) {
      addLog(`⏱️ Timeout test: ${error.message}`);
    }

    // Test 6: Test with different headers
    await testFetch('/api/v1/blogs?limit=3', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });

    addLog('✅ All tests completed');
  };

  // Auto-run tests on mount
  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">🐛 Blog API Debug Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Logs */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">📋 Logs</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setLogs([])}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Clear
                </button>
                <button
                  onClick={runAllTests}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {loading ? 'Running...' : 'Re-run Tests'}
                </button>
              </div>
            </div>
            
            <div className="h-[600px] overflow-y-auto bg-gray-900 text-white p-4 rounded font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-500">Waiting for tests to start...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="py-0.5 border-b border-gray-800">
                    {log}
                  </div>
                ))
              )}
              {loading && (
                <div className="py-2 text-yellow-400 animate-pulse">
                  ⏳ Running tests...
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Results</h2>
            
            {result ? (
              <div className="space-y-4">
                {result.error ? (
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <h3 className="text-red-800 font-semibold">❌ Error</h3>
                    <pre className="text-sm text-red-600 mt-2 whitespace-pre-wrap">
                      {typeof result.error === 'string' ? result.error : JSON.stringify(result.error, null, 2)}
                    </pre>
                    {result.raw && (
                      <div className="mt-4">
                        <h4 className="text-gray-700 font-semibold">Raw Response:</h4>
                        <pre className="text-sm bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap max-h-40 overflow-auto">
                          {result.raw}
                        </pre>
                      </div>
                    )}
                    {result.stack && (
                      <div className="mt-4">
                        <h4 className="text-gray-700 font-semibold">Stack Trace:</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap max-h-40 overflow-auto">
                          {result.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <h3 className="text-green-800 font-semibold">✅ Success</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        <strong>Success:</strong> {result.success ? 'true' : 'false'}
                      </p>
                      {result.data && (
                        <>
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Total Records:</strong> {result.data.length}
                          </p>
                          {result.meta && (
                            <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                              <strong>Meta:</strong>
                              <pre className="mt-1 whitespace-pre-wrap">
                                {JSON.stringify(result.meta, null, 2)}
                              </pre>
                            </div>
                          )}
                          {result.data.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-gray-700">Sample Data:</p>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 max-h-60 overflow-auto">
                                {JSON.stringify(result.data.slice(0, 3), null, 2)}
                              </pre>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-20">
                {loading ? 'Loading...' : 'No results yet. Running tests...'}
              </div>
            )}
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Tests</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => testFetch('/api/v1/blogs')}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Default
            </button>
            <button
              onClick={() => testFetch('/api/v1/blogs?limit=5')}
              disabled={loading}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
            >
              Limit 5
            </button>
            <button
              onClick={() => testFetch('/api/v1/blogs?featured=true')}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded disabled:opacity-50"
            >
              Featured
            </button>
            <button
              onClick={() => testFetch('/api/v1/blogs?status=1')}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50"
            >
              Status 1
            </button>
            <button
              onClick={() => testFetch('/api/v1/blogs?categories=true')}
              disabled={loading}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded disabled:opacity-50"
            >
              Categories
            </button>
            <button
              onClick={() => testFetch('/api/v1/blogs?stats=true')}
              disabled={loading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded disabled:opacity-50"
            >
              Stats
            </button>
          </div>
        </div>

        {/* Network Info */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🌐 Network Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
              <p><strong>Protocol:</strong> {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</p>
              <p><strong>Host:</strong> {typeof window !== 'undefined' ? window.location.host : 'N/A'}</p>
            </div>
            <div>
              <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
              <p><strong>Online:</strong> {typeof navigator !== 'undefined' ? navigator.onLine ? 'Yes' : 'No' : 'N/A'}</p>
              <p><strong>Connection:</strong> {typeof navigator !== 'undefined' && 'connection' in navigator ? (navigator as any).connection?.effectiveType || 'N/A' : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}