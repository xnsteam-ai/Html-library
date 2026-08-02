const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('component.html')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('registry/apps');
let changed = 0;
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  const orig = c;
  c = c.replace(/\s*<!-- Status bar -->[\s\S]*?<\/div>\s*<\/div>\s*/, '\n  ');
  c = c.replace(/\s*<!-- Home indicator -->[\s\S]*?<\/div>\s*<\/div>\s*/, '\n');
  if (orig !== c) {
    fs.writeFileSync(f, c);
    changed++;
  }
});
console.log('Changed ' + changed + ' files');
