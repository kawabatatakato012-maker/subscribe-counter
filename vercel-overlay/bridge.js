/**
 * bridge.js — ローカルで動かすTikFinityブリッジ
 * TikFinity WebSocket(ws://localhost:21213)からイベントを受信して
 * VercelのAPIにPOSTする
 *
 * 使い方:
 *   1. VERCEL_URLを自分のURLに変更する
 *   2. node bridge.js で起動
 */

const WebSocket = require('ws');

const TIKFINITY_WS = 'ws://localhost:21213';
const VERCEL_URL   = 'https://あなたのプロジェクト名.vercel.app'; // ← ここを変更

let count = 0;
let goal  = 100;

async function postState() {
  try {
    await fetch(`${VERCEL_URL}/api/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, goal })
    });
    console.log(`[Bridge] 送信: count=${count}, goal=${goal}`);
  } catch(e) {
    console.error('[Bridge] 送信失敗:', e.message);
  }
}

function connect() {
  console.log(`[Bridge] TikFinity接続中: ${TIKFINITY_WS}`);
  const ws = new WebSocket(TIKFINITY_WS);

  ws.on('open', () => console.log('[Bridge] TikFinity接続完了'));
  ws.on('close', () => { console.log('[Bridge] 切断 → 5秒後に再接続'); setTimeout(connect, 5000); });
  ws.on('error', e => console.warn('[Bridge] エラー:', e.message));

  ws.on('message', async (raw) => {
    try {
      const d = JSON.parse(raw);
      const t = (d.type || d.event || d.action || '').toLowerCase();

      if ((t.includes('sub') || t.includes('subscribe')) && !t.includes('unsub') && !t.includes('cancel')) {
        const n = d.subscriberCount ?? d.subCount ?? d.count ?? null;
        count = (typeof n === 'number') ? n : count + 1;
        await postState();
      }
      if (t.includes('unsub') || t.includes('cancel')) {
        count = Math.max(0, count - 1);
        await postState();
      }
    } catch(e) {}
  });
}

// 起動時に現在の状態をVercelに同期
postState().then(connect);
