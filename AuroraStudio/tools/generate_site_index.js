const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'site-index.json');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip node_modules and .git
      if (e.name === 'node_modules' || e.name === '.git') continue;
      files.push(...walk(full));
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if(['.html','.htm'].includes(ext)) {
        files.push(full);
      }
    }
  }
  return files;
}

function titleFromHtml(content, filePath) {
  // simple <title> fallback or h1
  const mTitle = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  if(mTitle) return mTitle[1].trim();
  const mH1 = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if(mH1) return mH1[1].replace(/<[^>]+>/g,'').trim();
  return path.basename(filePath);
}

function excerptFromHtml(content){
  const p = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if(!p) return '';
  const txt = p[1].replace(/<[^>]+>/g,'').trim();
  return txt.length > 140 ? txt.slice(0,137) + '...' : txt;
}

function makeHref(filePath){
  // create site-relative href
  const rel = path.relative(ROOT, filePath).split(path.sep).join('/');
  return rel;
}

function build(){
  const files = walk(ROOT);
  const items = files.map(f => {
    try{
      const raw = fs.readFileSync(f, 'utf8');
      return {
        title: titleFromHtml(raw, f),
        href: makeHref(f),
        excerpt: excerptFromHtml(raw)
      };
    }catch(e){
      return null;
    }
  }).filter(Boolean);

  fs.writeFileSync(OUT, JSON.stringify(items, null, 2), 'utf8');
  console.log('site-index.json written with', items.length, 'items to', OUT);
}

build();
