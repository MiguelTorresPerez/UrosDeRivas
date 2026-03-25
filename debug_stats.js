async function run() {
  try {
    // 1. Check if the expand error happens on single games just like the main feed
    const gameId = '1064168'; // Known generic game ID
    const res1 = await fetch(`https://api.clupik.com/games/${gameId}?clubId=67&navtabs=true&expand=organization,competition,group,group.phase,localTeam,stadium,localTeam.club,visitorTeam,visitorTeam.club&overrideClubId=67`);
    console.log("Single Game with group.phase status:", res1.status);

    const res2 = await fetch(`https://api.clupik.com/games/${gameId}?clubId=67&navtabs=true&expand=organization,competition,group,localTeam,stadium,localTeam.club,visitorTeam,visitorTeam.club&overrideClubId=67`);
    console.log("Single Game without group.phase status:", res2.status);

    // 2. Head to head fetching?
    // How does Clupik fetch direct confrontations between two teams?
    // Maybe filtering the global matches array is enough since we have 800 games!
  } catch(e) {
    console.error(e.message);
  }
}
run();
