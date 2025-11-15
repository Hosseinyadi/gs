import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestAPI = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name: string, url: string, options: RequestInit = {}) => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      const data = await response.json();
      const endTime = Date.now();
      
      setResults(prev => [...prev, {
        name,
        url,
        status: response.status,
        success: response.ok,
        data,
        time: endTime - startTime,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error: any) {
      const endTime = Date.now();
      setResults(prev => [...prev, {
        name,
        url,
        status: 'ERROR',
        success: false,
        error: error.message,
        time: endTime - startTime,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setResults([]);
    
    // Test 1: Health Check
    await testEndpoint('Health Check', 'http://localhost:8080/health');
    
    // Test 2: Admin Login
    await testEndpoint('Admin Login', 'http://localhost:8080/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    // Test 3: Send OTP
    await testEndpoint('Send OTP', 'http://localhost:8080/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone: '09123456789'
      })
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🧪 تست API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runTests} disabled={loading} className="w-full">
              {loading ? 'در حال تست...' : 'شروع تست'}
            </Button>

            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className={result.success ? 'border-green-500' : 'border-red-500'}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold">{result.name}</h3>
                        <span className={`px-2 py-1 rounded text-sm ${
                          result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        <strong>URL:</strong> {result.url}
                      </p>
                      
                      <p className="text-sm text-gray-600">
                        <strong>زمان:</strong> {result.time}ms | {result.timestamp}
                      </p>
                      
                      {result.error && (
                        <div className="bg-red-50 p-3 rounded">
                          <p className="text-sm text-red-800">
                            <strong>خطا:</strong> {result.error}
                          </p>
                        </div>
                      )}
                      
                      {result.data && (
                        <details className="bg-gray-50 p-3 rounded">
                          <summary className="cursor-pointer text-sm font-semibold">
                            پاسخ JSON
                          </summary>
                          <pre className="mt-2 text-xs overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAPI;
