// Keep the Editor.js structure and inline HTML used by the website.
function EscapeBlogHtml(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function BlogImageUrl(path, host) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (String(path).startsWith('//')) return 'https:' + path;
  return host.replace(/\/$/, '') + '/' + String(path).replace(/^\//, '');
}

function RenderBlogList(items, ordered) {
  var tag = ordered ? 'ol' : 'ul';
  return '<' + tag + '>' + (items || []).map(item => {
    var content = typeof item === 'string' ? item : (item.content || '');
    var children = typeof item === 'object' && item.items && item.items.length ? RenderBlogList(item.items, ordered) : '';
    return '<li>' + content + children + '</li>';
  }).join('') + '</' + tag + '>';
}

function BuildBlogArticleHtml(article, colors, host) {
  var content = (article.content || []).map(block => {
    var data = block.data || {};
    var body = '';
    if (block.type === 'paragraph') body = '<div>' + (data.text || '') + '</div>';
    if (block.type === 'header') body = '<h2>' + (data.text || '') + '</h2>';
    if (block.type === 'delimiter') body = '<div class="delimiter">* * *</div>';
    if (block.type === 'list') body = RenderBlogList(data.items, data.style === 'ordered');
    if (block.type === 'image' && data.file && data.file.url) {
      body = '<img src="' + EscapeBlogHtml(BlogImageUrl(data.file.url, host)) + '" alt="">' + (data.caption ? '<div class="caption">' + data.caption + '</div>' : '');
    }
    return body ? '<div class="block">' + body + '</div>' : '';
  }).join('');
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src https: http: data:; style-src \'unsafe-inline\'; base-uri https: http:"><base href="' + EscapeBlogHtml(host) + '/" target="_blank"><style>' +
    'html{color-scheme:light dark}body{margin:0;padding:16px 16px 32px;font-family:Roboto,Arial,sans-serif;font-size:16px;color:' + colors.text + ';background:' + colors.background + ';overflow-wrap:break-word}' +
    'h1{font-size:2em;margin:.67em 0}h2{font-size:1.5em;margin:.83em 0;font-weight:bold}.block{margin-top:16px}img{max-width:100%;height:auto;border-radius:10px}.cover{width:100%}.info{display:flex;justify-content:space-between;color:#aaa;font-size:14px;margin-bottom:10px}' +
    'a{color:#f05458}ol,ul{padding-left:24px}li{display:list-item}li>p:first-child{margin-top:0}li>p:last-child{margin-bottom:0}.delimiter{text-align:center}.caption{color:#aaa;font-size:14px;margin-top:5px}' +
    '</style></head><body><div class="info"><span>◉ ' + EscapeBlogHtml(article.look) + '</span><span>' + EscapeBlogHtml(article.created_at) + '</span></div><h1>' + EscapeBlogHtml(article.title) + '</h1>' +
    (article.image_url ? '<img class="cover" src="' + EscapeBlogHtml(BlogImageUrl(article.image_url, host)) + '" alt="">' : '') + content + '</body></html>';
}
