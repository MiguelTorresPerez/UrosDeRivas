const https = require('https');

const url = 'https://api.clupik.com/games?clubId=67&from=2025-08-01T00:00:00.000Z&to=2026-08-01T00:00:00.000Z&firstLoad=false&overrideClubId=67&expand=localTeam,localTeam.club,visitorTeam,visitorTeam.club,organization,competition,group,stadium';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed.slice(0, 2), null, 2));
    } catch (e) {
      console.error("JSON Error:", e.message);
      console.log("Raw:", data.slice(0, 500));
    }
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
