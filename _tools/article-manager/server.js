import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { readLibrary, writeLibrary } from './store.js';

const MAX_BODY_BYTES = 1024 * 1024;
const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
]);

function sendJson(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(value));
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

async function readJsonBody(request) {
  let size = 0;
  let tooLarge = false;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      tooLarge = true;
      continue;
    }
    chunks.push(chunk);
  }
  if (tooLarge) {
    const error = new Error('请求内容不能超过 1 MiB');
    error.status = 413;
    throw error;
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (cause) {
    const error = new Error(`JSON 格式错误：${cause.message}`, { cause });
    error.status = 400;
    throw error;
  }
}

function requestOriginIsAllowed(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  return origin === `http://${request.headers.host}`;
}

function safeStaticPath(managerDir, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const relativePath = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const target = resolve(managerDir, relativePath);
  const relation = relative(managerDir, target);
  if (!relation || relation.startsWith(`..${sep}`) || relation === '..') return null;
  return target;
}

async function serveStatic(request, response, managerDir, pathname) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    sendError(response, 405, '不支持该请求方法');
    return;
  }
  const filePath = safeStaticPath(managerDir, pathname);
  if (!filePath) {
    sendError(response, 404, '页面不存在');
    return;
  }
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw Object.assign(new Error('not a file'), { code: 'ENOENT' });
    response.writeHead(200, {
      'Content-Type': MIME_TYPES.get(extname(filePath)) ?? 'application/octet-stream',
      'Content-Length': fileStat.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') {
      response.end();
    } else {
      createReadStream(filePath).pipe(response);
    }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      sendError(response, 404, '页面不存在');
      return;
    }
    throw error;
  }
}

export function createEditorServer({ dataFile, managerDir, siteDir }) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host ?? '127.0.0.1'}`);

      if (url.pathname === '/api/library' && request.method === 'GET') {
        sendJson(response, 200, await readLibrary(dataFile));
        return;
      }

      if (url.pathname === '/api/library' && request.method === 'PUT') {
        if (!requestOriginIsAllowed(request)) {
          sendError(response, 403, '拒绝来自其他网页的写入请求');
          return;
        }
        if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
          sendError(response, 415, '请求必须使用 application/json');
          return;
        }
        const library = await readJsonBody(request);
        await writeLibrary(dataFile, library);
        sendJson(response, 200, library);
        return;
      }

      if (url.pathname.startsWith('/api/')) {
        sendError(response, 404, 'API 不存在');
        return;
      }

      if (siteDir && (url.pathname === '/reading' || url.pathname.startsWith('/reading/'))) {
        const readingPath = url.pathname.slice('/reading'.length) || '/';
        await serveStatic(request, response, resolve(siteDir, 'reading'), readingPath);
        return;
      }

      if (siteDir && url.pathname === '/data/reading-library.json') {
        await serveStatic(request, response, siteDir, url.pathname);
        return;
      }

      await serveStatic(request, response, managerDir, url.pathname);
    } catch (error) {
      const status = error.status ?? (/数据校验失败|JSON 格式错误/.test(error.message) ? 400 : 500);
      sendError(response, status, error.message || '服务器错误');
    }
  });
}

function openBrowser(url) {
  const command = process.platform === 'darwin'
    ? ['open', [url]]
    : process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : ['xdg-open', [url]];
  const child = spawn(command[0], command[1], { detached: true, stdio: 'ignore' });
  child.unref();
}

function getOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function startCli() {
  const managerDir = dirname(fileURLToPath(import.meta.url));
  const siteDir = resolve(managerDir, '../..');
  const dataFile = resolve(siteDir, 'data/reading-library.json');
  const port = Number(getOption('--port', process.env.ARTICLE_EDITOR_PORT ?? 4173));
  const server = createEditorServer({ dataFile, managerDir, siteDir });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`设计文章库管理工具：${url}`);
    console.log(`公开页面本地预览：${url}/reading/`);
    if (!process.argv.includes('--no-open')) openBrowser(url);
  });
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) startCli();
