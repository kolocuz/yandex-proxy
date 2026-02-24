export default async (request) => {
  const url = new URL(request.url);
  const targetUrl = 'https://cloud-api.yandex.net/v1/disk' + url.pathname.replace(/^\/disk/, '') + url.search;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  return newResponse;
};

export const config = {
  path: "/disk/*"
};
