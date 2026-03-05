import { put } from '@vercel/blob';

export default async function handler(request, response) {
  // CORS
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

  const safeSeed = seed.replace(/[^a-zA-Z0-9]/g, '_');
  const BLOB_PATH = `chats/${safeSeed}.json`;
  const BLOB_PUBLIC_URL = 'https://lfgf4utzuaubrsto.public.blob.vercel-storage.com';

  console.log(`[${request.method}] Request for seed: ${seed}`);

  try {
    // ========== GET - ПОЛУЧИТЬ СООБЩЕНИЯ ==========
    if (request.method === 'GET') {
      console.log(`GET: Attempting to read from ${BLOB_PUBLIC_URL}/${BLOB_PATH}`);
      try {
        const blobUrl = `${BLOB_PUBLIC_URL}/${BLOB_PATH}`;
        const res = await fetch(blobUrl);
        console.log(`GET: Fetch status: ${res.status}`);
        
        if (res.ok) {
          const messages = await res.json();
          console.log(`GET: Success, loaded ${messages.length} messages`);
          return response.status(200).json(messages);
        } else {
          console.log(`GET: File not found (${res.status}), returning empty array`);
          return response.status(200).json([]);
        }
      } catch (error) {
        console.error('GET: Error reading blob:', error.message);
        return response.status(200).json([]);
      }
    }

    // ========== POST - ДОБАВИТЬ СООБЩЕНИЕ ==========
    if (request.method === 'POST') {
      console.log('POST: Received body:', JSON.stringify(request.body, null, 2));
      
      const { message } = request.body;
      
      if (!message) {
        console.error('POST: Missing message in body');
        return response.status(400).json({ 
          error: 'Missing message object',
          receivedBody: request.body 
        });
      }
      console.log('POST: Message extracted:', JSON.stringify(message, null, 2));

      // Загружаем существующие сообщения
      let messages = [];
      try {
        const blobUrl = `${BLOB_PUBLIC_URL}/${BLOB_PATH}`;
        console.log(`POST: Reading existing messages from ${blobUrl}`);
        const res = await fetch(blobUrl);
        console.log(`POST: Read status: ${res.status}`);
        
        if (res.ok) {
          messages = await res.json();
          console.log(`POST: Loaded ${messages.length} existing messages`);
        } else {
          console.log('POST: No existing file, starting fresh');
        }
      } catch (error) {
        console.log('POST: Error reading existing file (normal for new chat):', error.message);
      }

      // Добавляем новое сообщение
      messages.push(message);
      console.log(`POST: Added new message, total now: ${messages.length}`);

      // Ограничиваем историю
      if (messages.length > 1000) {
        messages = messages.slice(-1000);
        console.log(`POST: Trimmed to last 1000 messages`);
      }

      // Сохраняем в Blob
      try {
        console.log(`POST: Attempting to save to Blob at path: ${BLOB_PATH}`);
        const { url } = await put(BLOB_PATH, JSON.stringify(messages), {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false,
        });
        console.log(`POST: Save successful! Blob URL: ${url}`);

        return response.status(200).json({ 
          success: true, 
          messageCount: messages.length,
          blobUrl: url 
        });
      } catch (putError) {
        console.error('POST: Fatal error during put operation:', putError);
        return response.status(500).json({ 
          error: 'Failed to save to Blob',
          details: putError.message 
        });
      }
    }

    return response.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Fatal error in handler:', error);
    return response.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack 
    });
  }
}
