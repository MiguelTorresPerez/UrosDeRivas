const clubId = '67';
const url1 = `https://api.clupik.com/games?clubId=${clubId}&from=2020-01-01T00:00:00.000Z&to=2030-01-01T00:00:00.000Z&firstLoad=false&overrideClubId=${clubId}&expand=localTeam,localTeam.club,visitorTeam,visitorTeam.club,organization,competition,group,stadium&limit=100`;

const url2 = `https://api.clupik.com/games?clubId=67&from=2026-03-22T23:00:00.000Z&to=2026-03-29T21:59:59.999Z&firstLoad=false&overrideClubId=67&expand=localTeam,localTeam.club,visitorTeam,visitorTeam.club,organization,competition,group,stadium`;

async function fetchUrl(url, name) {
  try {
    console.log(`\nFetching ${name}...`);
    const res = await fetch(url);
    const json = await res.json();
    const list = Array.isArray(json) ? json : (json.data || []);
    console.log(`Length: ${list.length}`);
    if (list.length > 0) {
      console.log(`First game Date: ${list[0].date}`);
      console.log(`First game ID: ${list[0].id}`);
    }
  } catch (e) {
    console.error(e.message);
  }
}

async function run() {
  await fetchUrl(url1, "WIDE BOUNDS");
  await fetchUrl(url2, "USER EXACT BOUNDS");
  
  // also what about simply no date bounds?
  await fetchUrl(`https://api.clupik.com/games?clubId=67&limit=20&expand=localTeam,localTeam.club,visitorTeam,visitorTeam.club,organization,competition,group,stadium`, "NO DATE BOUNDS");
}

run();
