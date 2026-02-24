export default async (request) => {
  const url = new URL(request.url);
  
  // Убираем префикс /disk из пути запроса
  // Например, если запрос пришёл на /disk/v1/disk, останется /v1/disk
  const path = url.pathname.replace(/^\/disk/, '') || '/';
  
  // Формируем правильный URL для Яндекс.Диска
  const targetUrl = 'https://cloud-api.yandex.net' + path + url.search;

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
