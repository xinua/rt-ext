// Stand-in for the Retriever app, so the extension can be tried without
// installing the real app. It answers the same API the extension calls, keeps
// everything in memory and fetches nothing: a sent link only changes status
// from queued to done over a few seconds.
//
//   node backend_mock.js              http://localhost:31080
//   PORT=8080 node backend_mock.js    another port
//
// Links containing "fail" end as failed, to show the error state.
//
// Live status updates go over a minimal socket.io endpoint built on the `ws`
// package (a devDependency, present after `pnpm install`). Without it the mock
// still works; the popup then shows the new status when it is reopened.

const http = require('node:http');
const { randomUUID } = require('node:crypto');

const PORT = Number(process.env.PORT) || 31080;
const FOLDERS = { root: '/library', folders: ['movies', 'music', 'shows'] };

/** @type {Map<number, Record<string, unknown>>} */
const rows = new Map();
let nextId = 1;

// HTTP API

const server = http.createServer(async (req, res) => {
  const { pathname, searchParams } = new URL(req.url ?? '/', `http://${req.headers.host}`);
  console.log(req.method, req.url);

  // Extension pages are another origin; the real app allows them too.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return send(res, 204);

  if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { ok: true });
  if (req.method === 'GET' && pathname === '/api/folders') return send(res, 200, FOLDERS);
  if (req.method === 'GET' && pathname === '/api/downloads/lookup') {
    return send(res, 200, lookup(searchParams.get('url') ?? ''));
  }
  if (req.method === 'GET' && pathname === '/api/downloads') {
    return send(res, 200, [...rows.values()].reverse());
  }
  if (req.method === 'POST' && pathname === '/api/downloads') {
    const body = await readJson(req);
    if (typeof body?.url !== 'string' || !body.url.trim()) {
      return send(res, 400, { ok: false, error: 'url is required' });
    }
    const row = createRow(body);
    return send(res, 200, {
      ok: true,
      kind: 'video',
      playlistId: null,
      playlistTitle: null,
      queued: 1,
      truncated: false,
      limit: 1,
      downloads: [row],
    });
  }
  if (req.method === 'GET' && pathname === '/') return sendPage(res);

  send(res, 404, { ok: false, error: 'Not found' });
});

function send(res, status, body) {
  if (body === undefined) return res.writeHead(status).end();
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** The latest row per type for the URL, as GET /api/downloads/lookup answers. */
function lookup(url) {
  const latest = (type) => {
    const matches = [...rows.values()].filter((row) => row.url === url && row.type === type);
    return matches.slice(-1);
  };
  return { video: latest('video'), audio: latest('audio') };
}

// Rows and their fake progress

function createRow(body) {
  const id = nextId++;
  const row = {
    id,
    watcherId: null,
    channelId: null,
    channelName: null,
    videoId: null,
    title: `Mock item #${id}`,
    url: body.url,
    status: 'queued',
    source: { url: body.url, prefix: body.prefix ?? '', folder: body.folder ?? '' },
    platform: 'unknown',
    type: body.type === 'audio' ? 'audio' : 'video',
    format: body.format ?? null,
    codec: body.codec ?? null,
    quality: body.quality ?? null,
    mediaQuality: null,
    mediaCodec: null,
    folder: body.folder ?? null,
    prefix: body.prefix ?? null,
    ytdlpArgs: body.ytdlpArgs ?? null,
    clipStart: null,
    clipEnd: null,
    removeSponsor: false,
    splitChapters: false,
    playlistId: null,
    playlistTitle: null,
    playlistIndex: null,
    duration: null,
    progress: 0,
    speed: null,
    eta: null,
    totalBytes: null,
    filePath: null,
    avatarPath: null,
    thumbnailPath: null,
    authorUrl: null,
    error: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
  };
  rows.set(id, row);
  simulate(row);
  return row;
}

/** queued → running (25% steps, one per second) → done, or failed for "fail" links. */
function simulate(row) {
  const willFail = row.url.includes('fail');
  const timer = setInterval(() => {
    if (row.status === 'queued') {
      update(row, { status: 'running', startedAt: new Date().toISOString() });
    } else if (willFail && row.progress >= 50) {
      clearInterval(timer);
      update(row, { status: 'failed', error: 'Mock failure: the link contains "fail"' });
    } else if (row.progress < 100) {
      update(row, { progress: row.progress + 25 });
    } else {
      clearInterval(timer);
      update(row, { status: 'done', finishedAt: new Date().toISOString() });
    }
  }, 1000);
}

function update(row, patch) {
  Object.assign(row, patch);
  console.log(`  #${row.id} ${row.status} ${row.progress}%`);
  broadcast('download-updated', row);
}

// socket.io, the small part the extension uses: the websocket transport on
// /ws, and `message` events from server to client. Engine.io packet types:
// 0 open, 2 ping, 3 pong, 4 message; socket.io: 0 connect, 2 event.

const sockets = new Set();

function broadcast(type, data) {
  const packet = '42' + JSON.stringify(['message', { type, data }]);
  sockets.forEach((socket) => socket.send(packet));
}

let WebSocketServer = null;
try {
  ({ WebSocketServer } = require('ws'));
} catch {
  console.warn('The `ws` package is missing (run `pnpm install`); live updates are off.');
}

if (WebSocketServer) {
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/ws/')) return socket.destroy();
    wss.handleUpgrade(req, socket, head, (ws) => {
      const pingInterval = 25000;
      ws.send(
        '0' +
          JSON.stringify({
            sid: randomUUID(),
            upgrades: [],
            pingInterval,
            pingTimeout: 20000,
            maxPayload: 1e6,
          }),
      );
      const ping = setInterval(() => ws.send('2'), pingInterval);

      ws.on('message', (data) => {
        // The client joins the default namespace; confirm it and start sending events.
        if (data.toString().startsWith('40')) {
          ws.send('40' + JSON.stringify({ sid: randomUUID() }));
          sockets.add(ws);
        }
      });
      ws.on('close', () => {
        clearInterval(ping);
        sockets.delete(ws);
      });
    });
  });
}

// A page for "Open app": lists the sent links and shows whether the app
// bridge (src/content/app-bridge.ts) has said hello.

function sendPage(res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Retriever (mock)</title>
  <style>
    body { font: 15px/1.5 system-ui, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ddd; word-break: break-all; }
  </style>
</head>
<body>
  <h1>Retriever (mock)</h1>
  <p id="bridge">Extension: not detected yet.</p>
  <table>
    <thead><tr><th>#</th><th>Type</th><th>Status</th><th>URL</th></tr></thead>
    <tbody id="rows"></tbody>
  </table>
  <script>
    window.addEventListener('message', (e) => {
      if (e.source === window && e.data?.source === 'retriever-extension' && e.data.type === 'hello') {
        document.getElementById('bridge').textContent = 'Extension: detected, version ' + e.data.version;
      }
    });
    window.postMessage({ source: 'retriever-app', type: 'ping' }, location.origin);

    async function refresh() {
      const rows = await (await fetch('/api/downloads')).json();
      const body = document.getElementById('rows');
      body.replaceChildren(...rows.map((row) => {
        const tr = document.createElement('tr');
        const status = row.status === 'running' ? 'running ' + row.progress + '%' : row.status;
        for (const text of [row.id, row.type, status, row.url]) {
          const td = document.createElement('td');
          td.textContent = text;
          tr.append(td);
        }
        return tr;
      }));
    }
    refresh();
    setInterval(refresh, 1000);
  </script>
</body>
</html>`);
}

server.listen(PORT, () => {
  console.log(`Retriever mock listening on http://localhost:${PORT}`);
  console.log('Enter this address on the extension options page.');
});
