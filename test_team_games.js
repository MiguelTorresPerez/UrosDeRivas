async function run() {
  try {
    const res = await fetch('https://api.clupik.com/games?clubId=67&teamId=1702427');
    const json = await res.json();
    console.log("Games for team 1702427:", Array.isArray(json) ? json.length : json.data?.length);

    // Let's test again if ANY games exist in the user's provided range if we include organizationId or something
    const res2 = await fetch('https://api.clupik.com/games?clubId=67&languageId=709&from=2024-01-01T00:00:00.000Z&to=2026-12-31T00:00:00.000Z');
    const j2 = await res2.json();
    console.log("Games wild:", Array.isArray(j2) ? j2.length : j2.data?.length);
  } catch(e) { console.error(e.message); }
}
run();
