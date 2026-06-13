// Vercel Serverless Function (SSE endpoint)
// GET /api/events  → オーバーレイがここを購読してリアルタイム更新を受け取る
// POST /api/events → TikFinityブリッジ(ローカル)がここにイベントをPOSTする

// Vercelはサーバーレスなのでメモリ共有できないため、
// ここではシンプルにPOSTで受け取ったデータをそのままレスポンスに返す形にする。
// リアルタイム配信はSSEで実現。

// ただしVercelのサーバーレス関数はlong-pollingが難しいため、
// クライアント側はポーリングで /api/count を定期取得する方式にする。

let currentCount = 0;
let currentGoal  = 100;

module.exports = (req, res) => {
  if (req.method === 'GET') {
    res.status(200).json({ count: currentCount, goal: currentGoal });
    return;
  }
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        if (typeof d.count === 'number') currentCount = d.count;
        if (typeof d.goal  === 'number') currentGoal  = d.goal;
        res.status(200).json({ ok: true, count: currentCount, goal: currentGoal });
      } catch(e) {
        res.status(400).json({ error: 'invalid json' });
      }
    });
    return;
  }
  res.status(405).end();
};
