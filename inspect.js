const axios = require('axios');
const fs = require('fs');

async function test() {
  const r = await axios.get('https://www.instagram.com/p/C8r2cOxyX3m/embed/captioned/');
  const matches = [...r.data.matchAll(/https:[^"'\s\\]+cdninstagram[^"'\s\\]+/g)].map(m => m[0]);
  console.log('Found links:', matches.length);
  console.log(matches.slice(0, 3));
}
test().catch(console.error);

