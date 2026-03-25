async function run() {
  // 1. Fetch teams
  let teams = [];
  try {
    const res = await fetch('https://api.clupik.com/clubs/67/teams?limit=5');
    teams = await res.json();
    console.log("Team 1:", JSON.stringify(teams[0], null, 2));
  } catch(e) { console.error("Teams error", e); }

  // 2. Fetch games for team 1 ?
  if (teams.length > 0) {
    const tId = teams[0].id;
    try {
      const gRes = await fetch(`https://api.clupik.com/games?clubId=67&teamId=${tId}&languageId=709`);
      const gJson = await gRes.json();
      console.log(`Games for team ${teams[0].name}:`, Array.isArray(gJson) ? gJson.length : gJson.data?.length);
    } catch(e) {}
  }

  // 3. Test if languageId=709 fixes the URL the user gave
  try {
    const res2 = await fetch(`https://api.clupik.com/games?clubId=67&from=2020-01-01T00:00:00.000Z&to=2030-01-01T00:00:00.000Z&firstLoad=false&overrideClubId=67&expand=localTeam,localTeam.club,visitorTeam,visitorTeam.club,organization,competition,group,stadium&languageId=709`);
    const j2 = await res2.json();
    console.log(`Games with languageId:`, Array.isArray(j2) ? j2.length : j2.data?.length);
  } catch(e) {}
}
run();
