// /api/sse
// オーバーレイがここをSSEで購読する
// /api/push からイベントが来たらクライアントに配信する

// Vercelはサーバーレスなのでインプロセスのメモリ共有ができない
// → KV不要のシンプル構成として「ポーリング+状態API」方式を使う
// オーバーレイは /api/state を2秒ごとにfetchして差分を検知する

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 初回送信
  res.write('data: {"type":"connected"}\n\n');

  // Vercelのサーバーレス関数は長時間接続を保てないため
  // クライアント側でSSE再接続 + /api/state ポーリングを併用する
  const interval = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => clearInterval(interval));
};
