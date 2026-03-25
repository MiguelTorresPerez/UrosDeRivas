import { useState, useEffect } from 'react';
import './Clasificaciones.css';

interface ClupikGame {
  gameId: string;
  localTeamName: string;
  localTeamEditableName: string;
  visitorTeamName: string;
  visitorTeamEditableName: string;
  localScore: number;
  visitorScore: number;
  status: string;
  date: string;
  localTeamShieldUrl: string;
  visitorTeamShieldUrl: string;
}

interface GameDetail {
  id: string;
  competition?: { name: string };
  group?: { title: string; phase?: { title: string } };
  localTeam?: { club?: { name: string, twitterUrl?: string } };
  visitorTeam?: { club?: { name: string, twitterUrl?: string } };
}

interface Standing {
  position: number;
  team: string;
  played: number;
  won: number;
  lost: number;
  points: number;
}

export function Clasificaciones() {
  const [tab, setTab] = useState<'partidos' | 'clasificacion'>('partidos');
  const [clubId, setClubId] = useState<string>('67'); // 67 = Uros de Rivas
  const [matches, setMatches] = useState<ClupikGame[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  // Deep Dive State
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameDetail, setGameDetail] = useState<GameDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchGeneralData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.clupik.com/clubs/${clubId}/games/publications?limit=80&languageId=709&languageCode=ES`);
        if (!res.ok) throw new Error("Network response was not ok");
        const json = await res.json();
        
        let allGames: ClupikGame[] = [];
        json.forEach((pub: any) => {
          if (pub.card && pub.card.games && Array.isArray(pub.card.games)) {
            allGames = [...allGames, ...pub.card.games];
          }
        });

        // Deduplicate games by gameId
        const uniqueGames = Array.from(new Map(allGames.map(item => [item.gameId, item])).values());
        
        // Sort by date descending
        uniqueGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setMatches(uniqueGames);

        // Standings Fallback
        setStandings([
          { position: 1, team: 'Uros de Rivas', played: 22, won: 18, lost: 4, points: 40 },
          { position: 2, team: 'Movistar Estudiantes', played: 22, won: 17, lost: 5, points: 39 },
          { position: 3, team: 'Baloncesto Aristos A', played: 22, won: 15, lost: 7, points: 37 }
        ]);
      } catch (err) {
        console.error("Failed to fetch general Clupik Data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeneralData();
  }, [clubId]);

  const handleGameClick = async (gameId: string) => {
    if (selectedGameId === gameId) {
      setSelectedGameId(null);
      setGameDetail(null);
      return;
    }
    
    setSelectedGameId(gameId);
    setLoadingDetail(true);
    setGameDetail(null);

    try {
      const res = await fetch(`https://api.clupik.com/games/${gameId}?clubId=${clubId}&languageId=709&navtabs=true&expand=organization,competition,group,group.phase,localTeam,stadium,localTeam.club,visitorTeam,visitorTeam.club&overrideClubId=${clubId}`);
      if (!res.ok) throw new Error("Failed to fetch game detail");
      const json = await res.json();
      setGameDetail(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="stands-container">
      <div className="stands-header">
        <h1>Competición en Vivo</h1>
        
        <div className="stands-controls">
          <div className="stands-tabs">
            <button className={`tab-btn ${tab === 'partidos' ? 'active' : ''}`} onClick={() => setTab('partidos')}>Partidos</button>
            <button className={`tab-btn ${tab === 'clasificacion' ? 'active' : ''}`} onClick={() => setTab('clasificacion')}>Clasificación</button>
          </div>
          
          <select 
            className="club-selector" 
            value={clubId} 
            onChange={(e) => {
              setClubId(e.target.value);
              setSelectedGameId(null);
            }}
          >
            <option value="67">Uros de Rivas (67)</option>
            <option value="15">Otro Club Ejemplo (15)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Desplegando infraestructura de datos...</div>
      ) : (
        <div className="stands-content animate-slide-up">
          {tab === 'partidos' && (
            <div className="matches-list">
              {matches.length === 0 ? (
                <div className="no-items">El club no cuenta con partidos recientes registrados.</div>
              ) : (
                matches.map(m => (
                  <div key={m.gameId} className="match-wrapper">
                    <div 
                      className={`match-card ${selectedGameId === m.gameId ? 'expanded' : ''}`}
                      onClick={() => handleGameClick(m.gameId)}
                    >
                      <div className="match-date">
                        {new Date(m.date).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      
                      <div className="match-teams">
                        <div className="team local-team">
                          <span className="team-name">{m.localTeamEditableName || m.localTeamName}</span>
                          {m.localTeamShieldUrl && <img src={m.localTeamShieldUrl} alt="shield" className="team-shield" />}
                          {m.status === 'finished' && <span className="team-score">{m.localScore}</span>}
                        </div>
                        
                        <div className="match-vs">VS</div>
                        
                        <div className="team visitor-team">
                          {m.status === 'finished' && <span className="team-score">{m.awayScore ?? m.visitorScore}</span>}
                          {m.visitorTeamShieldUrl && <img src={m.visitorTeamShieldUrl} alt="shield" className="team-shield" />}
                          <span className="team-name">{m.visitorTeamEditableName || m.visitorTeamName}</span>
                        </div>
                      </div>
                      
                      <div className="match-status">
                        {m.status === 'finished' ? <span className="badge-played">Final</span> : <span className="badge-scheduled">Próximo</span>}
                      </div>
                    </div>

                    {/* Detailed Dropdown / Browsing Section */}
                    {selectedGameId === m.gameId && (
                      <div className="match-deep-stats animate-slide-down">
                        {loadingDetail ? (
                          <span className="loading-msg">Analizando detalles del partido...</span>
                        ) : gameDetail ? (
                          <div className="deep-stats-grid">
                            <div className="stat-block">
                              <span className="stat-label">COMPETICIÓN</span>
                              <span className="stat-value">{gameDetail.competition?.name || 'N/D'}</span>
                            </div>
                            <div className="stat-block">
                              <span className="stat-label">FASE / GRUPO</span>
                              <span className="stat-value">
                                {gameDetail.group?.phase?.title ? `${gameDetail.group.phase.title} • ` : ''}
                                {gameDetail.group?.title || 'N/D'}
                              </span>
                            </div>
                            <div className="stat-block">
                              <span className="stat-label">CLUB INVITADO</span>
                              <span className="stat-value">{gameDetail.visitorTeam?.club?.name || 'N/D'}</span>
                            </div>
                            <div className="stat-block">
                              <span className="stat-label">CLUB LOCAL</span>
                              <span className="stat-value">{gameDetail.localTeam?.club?.name || 'N/D'}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="loading-msg">Información no disponible</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'clasificacion' && (
            <div className="table-responsive">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Equipo</th>
                    <th>PJ</th>
                    <th>G</th>
                    <th>P</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map(s => (
                    <tr key={s.position} className={s.team === 'Uros de Rivas' ? 'row-highlight' : ''}>
                      <td>{s.position}</td>
                      <td className="team-col">{s.team}</td>
                      <td>{s.played}</td>
                      <td>{s.won}</td>
                      <td>{s.lost}</td>
                      <td className="points-col">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
