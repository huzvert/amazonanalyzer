// Script to fix cookies.json by adding sameSite property if missing or invalid
const fs = require('fs');

const file = 'cookies.json';
const validSameSite = ['Strict', 'Lax', 'None'];

let cookies = JSON.parse(fs.readFileSync(file, 'utf8'));
let changed = false;

for (let cookie of cookies) {
  if (!cookie.sameSite || !validSameSite.includes(cookie.sameSite)) {
    cookie.sameSite = 'Lax';
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(file, JSON.stringify(cookies, null, 2));
  console.log('✅ cookies.json fixed: all cookies now have sameSite property set to Lax if missing or invalid.');
} else {
  console.log('✅ cookies.json already valid. No changes made.');
}
