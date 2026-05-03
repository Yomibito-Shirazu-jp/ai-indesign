const http = require('http');

const code = [
  'var doc;',
  'if (app.documents.length > 0) {',
  '  doc = app.activeDocument;',
  '} else {',
  '  doc = await app.documents.add();',
  '  if (!doc && app.documents.length > 0) doc = app.documents.item(0);',
  '}',
  'if (!doc) return "ERROR: could not create document";',
  'var page = doc.pages.item(0);',
  'var tf = page.textFrames.add();',
  'tf.geometricBounds = [30, 20, 200, 190];',
  'tf.contents = "クラウドヤマニノボレ\\n\\nＡｉ－ｉｎＤｅｓｉｇｎ\\n\\n接続成功！";',
  'var text = tf.texts.item(0);',
  'text.pointSize = 48;',
  'tf.strokeWeight = 5;',
  'tf.strokeColor = doc.swatches.itemByName("Black");',
  'app.select(tf);',
  'return "OK: " + doc.name;'
].join('\n');

const data = JSON.stringify({ code });
const req = http.request({
  hostname: '127.0.0.1', port: 49300, path: '/execute', method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log(body));
});
req.on('error', e => console.log('ERR:', e.message));
req.write(data);
req.end();
