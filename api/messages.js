import { put } from '@vercel/blob';

export default async function handler(request, response) {
  // CORS для вашего GitHub Pages сайта
  response.setHeader('Access-Control-Allow-Origin', 'https://kolocuz.github.io');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { seed } = request.query;
  if (!seed) {
    return response.status(400).json({ error: 'Missing seed parameter' });
  }

  // Очищаем seed для безопасного имени файла
  const safeSeed = seed.replace(/[^a-zA-Z0-9]/g, '_');
  const BLOB_PATH = `chats/${safeSeed}.json`;
  
  // ВАШ РЕАЛЬНЫЙ ПУБЛИЧНЫЙ URL (без слеша в конце)
  const BLOB_PUBLIC_URL = 'https://lfgf4utzuaubrsto.public.blob.vercel-storage.com';

  try {
    // ========== ПОЛУЧИТЬ СООБЩЕНИЯ ==========
    if (request.method === 'GET') {
      try {
        const blobUrl = `${BLOB_PUBLIC_URL}/${BLOB_PATH}`;
        console.log('Fetching from:', blobUrl); // для отладки
        
        const res = await fetch(blobUrl);
        
        if (res.ok) {
          const messages = await res.json();
          return response.status(200).json(messages);
        } else {
          // Файл не найден (новая комната)
          return response.status(200).json([]);
        }
      } catch (error) {
        console.log('Error reading blob:', error.message);
        // Возвращаем пустой массив при любой ошибке чтения
        return response.status(200).json([]);
      }
    }

    // ========== ДОБАВИТЬ СООБЩЕНИЕ ==========
    if (request.method === 'POST') {
      const { message } = request.body;
      if (!message) {
        return response.status(400).json({ error: 'Missing message' });
      }

      // Загружаем существующие сообщения
      let messages = [];
      try {
        const blobUrl = `${BLOB_PUBLIC_URL}/${BLOB_PATH}`;
        const res = await fetch(blobUrl);
        if (res.ok) {
          messages = await res.json();
        }
      } catch (error) {
        console.log('No existing file, creating new one');
      }

      // Добавляем новое сообщение
      messages.push(message);

      // Ограничиваем историю (последние 1000 сообщений)
      if (messages.length > 1000) {
        messages = messages.slice(-1000);
      }

      // Сохраняем через SDK Vercel Blob
      const { url } = await put(BLOB_PATH, JSON.stringify(messages), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false, // Важно: не добавляем суффикс!
      });

      return response.status(200).json({ 
        success: true, 
        url: url,
        messageCount: messages.length 
      });
    }

    return response.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Fatal error:', error);
    return response.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
