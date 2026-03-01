import type { Context, Config } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    // Создаём новый ответ с CORS-заголовками
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return newResponse;
  } catch (error) {
    return new Response('Proxy error: ' + error.message, { status: 500 });
  }
};

export const config: Config = {
  path: "/proxy"
};