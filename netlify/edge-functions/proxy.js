export default async (request) => {
  const url = new URL(request.url);
  
  // Убираем префикс /disk из пути запроса
  const path = url.pathname.replace(/^\/disk/, '') || '/';
  const targetUrl = 'https://cloud-api.yandex.net' + path + url.search;

  // Возвращаем отладочную информацию вместо запроса к API
  return new Response(JSON.stringify({
    receivedPath: url.pathname,
    processedPath: path,
    targetUrl: targetUrl,
    message: "Это отладочный ответ. Прокси работает, но сейчас возвращает эту информацию вместо запроса к API."
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = {
  path: "/disk/*"
};
