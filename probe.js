async function fetchUrl(url, name) {
  try {
    console.log(`\n--- ${name} ---`);
    console.log(`URL: ${url}`);
    const res = await fetch(url);
    const json = await res.json();
    const list = Array.isArray(json) ? json : (json.data || json.teams || []);
    console.log(`Length: ${list.length}`);
    if (list.length > 0) {
      console.log(`Sample ID: ${list[0].id}`);
      if (list[0].name) console.log(`Sample Name: ${list[0].name}`);
      if (list[0].competition) console.log(`Sample Competition: ${list[0].competition.name}`);
    } else {
      console.log("Empty or returned an object instead of array.");
      if (!Array.isArray(json) && Object.keys(json).length > 0) {
         console.log("Keys:", Object.keys(json).join(", "));
      }
    }
  } catch (e) {
    console.error(`Failed ${name}:`, e.message);
  }
}

async function run() {
  await fetchUrl('https://api.clupik.com/clubs/67/teams', "TEAMS BY CLUB 1");
  await fetchUrl('https://api.clupik.com/teams?clubId=67', "TEAMS BY CLUB 2");
  await fetchUrl('https://api.clupik.com/teams/1675513/games', "GAMES BY TEAM 1");
  await fetchUrl('https://api.clupik.com/games?teamId=1675513', "GAMES BY TEAM 2");
  await fetchUrl('https://api.clupik.com/games?organizationId=7193&competitionId=17641', "GAMES BY COMPETITION");
}

run();
