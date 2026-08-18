const API_BASE = 'https://ykybklpdhd.execute-api.eu-west-3.amazonaws.com/prod';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://quinileague.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '3600',
};

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/cors') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const path = url.pathname;
    const apiUrl = `${API_BASE}${path}${url.search}`;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const response = await fetch(apiUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: request.method !== 'GET' ? request.text() : undefined,
    });

    const responseHeaders = new Headers();
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(key, value);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
} satisfies ExportedHandler;
