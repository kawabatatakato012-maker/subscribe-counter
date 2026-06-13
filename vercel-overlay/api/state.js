// GET  /api/state  → 現在のcount/goalを返す
// POST /api/state  → count/goalを更新する（ローカルブリッジから呼ぶ）
// Vercel KVを使う（VERCEL_KV_REST_API_URL / TOKEN が環境変数に必要）
// KVがない場合はメモリフォールバック（単一インスタンス時のみ動作）

const KV_URL   = process.env.VERCEL_KV_REST_API_URL || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.VERCEL_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;

let memState = { count: 0, goal: 100 }; // フォールバック用

async function kvGet() {
  if (!KV_URL) return null;
  const r = await fetch(`${KV_URL}/get/overlay_state`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const j = await r.json();
  return j.result ? JSON.parse(j.result) : null;
}

async function kvSet(state) {
  if (!KV_URL) return;
  await fetch(`${KV_URL}/set/overlay_state`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(state))
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method === 'GET') {
    const state = (await kvGet()) || memState;
    res.status(200).json(state);
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const d = JSON.parse(body);
        const state = (await kvGet()) || { ...memState };
        if (typeof d.count === 'number') state.count = d.count;
        if (typeof d.goal  === 'number') state.goal  = d.goal;
        memState = state;
        await kvSet(state);
        res.status(200).json({ ok: true, ...state });
      } catch(e) {
        res.status(400).json({ error: 'invalid json' });
      }
    });
    return;
  }
  res.status(405).end();
};
