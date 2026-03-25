const https = require('https');

https.get('https://api.clupik.com/clubs/67/games/publications?limit=1&languageId=709&languageCode=ES', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
