async function run() {
  const url = `https://api.clupik.com/games?clubId=67&from=2025-08-01T00:00:00.000Z&to=2026-08-01T00:00:00.000Z&firstLoad=false&overrideClubId=67&expand=localTeam,localTeam.club,visitorTeam,visitorTeam.club,organization,competition,group,stadium`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("Keys in response:", Object.keys(json));
    if (json.games) {
      console.log("Length of json.games:", json.games.length);
      if (json.games.length > 0) {
        console.log("Sample game ID:", json.games[0].id);
      }
    } else if (Array.isArray(json)) {
      console.log("Response is array. Length:", json.length);
    }
  } catch(e) { console.error(e.message); }
}
run();
