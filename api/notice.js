// 네이버 블로그 RSS를 읽어 홈페이지 공지(NOTICE)에 최신 글을 보여주는 함수
const BLOG_ID = 'byeollaemathteacher';
const RSS_URL = 'https://rss.blog.naver.com/' + BLOG_ID + '.xml';
const LIMIT = 4;

function pick(block, tag) {
  const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
  if (!m) return '';
  return m[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
}
function decode(s) {
  return s.replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&').trim();
}
function fmtDate(s) {
  const d = new Date(s);
  if (isNaN(d)) return '';
  const k = new Date(d.getTime() + 9 * 3600 * 1000); // 한국 시간
  const p = n => String(n).padStart(2, '0');
  return k.getUTCFullYear() + '.' + p(k.getUTCMonth() + 1) + '.' + p(k.getUTCDate());
}

module.exports = async (req, res) => {
  try {
    const r = await fetch(RSS_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (allsem.vercel.app notice)' } });
    if (!r.ok) throw new Error('RSS ' + r.status);
    const xml = await r.text();
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xml)) && items.length < LIMIT) {
      const title = decode(pick(m[1], 'title'));
      let link = decode(pick(m[1], 'link')).split('?')[0];
      if (!title || !/^https:\/\/(m\.)?blog\.naver\.com\//.test(link)) continue;
      items.push({ title: title, link: link, date: fmtDate(pick(m[1], 'pubDate')) });
    }
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
    res.status(200).json({ items: items });
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    res.status(200).json({ items: [], error: 'unavailable' });
  }
};
