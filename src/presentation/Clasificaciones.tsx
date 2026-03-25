import { useState, useEffect, useMemo } from 'react';
import './Clasificaciones.css';

interface ClupikGame {
  id: string;
  gameId?: string; // from publications fallback
  localTeamName: string;
  localTeamEditableName: string;
  visitorTeamName: string;
  visitorTeamEditableName: string;
  localScore: number;
  visitorScore: number;
  status: string;
  date: string;
  localTeamId?: string;
  visitorTeamId?: string;
  localTeamShieldUrl?: string;
  visitorTeamShieldUrl?: string;
  competitionId?: string;
  groupId?: string;
  competition?: { id: string; name: string };
  group?: { id: string; title: string; phaseId?: string, phase?: { id: string, title: string } };
  localTeam?: { id: string, shieldUrl: string, club?: { id: string, name: string } };
  visitorTeam?: { id: string, shieldUrl: string, club?: { id: string, name: string } };
}

interface StandingTeam {
  rankingOrder: number;
  rankingPoints: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  pointsScored: number;
  pointsReceived: number;
  team: { id?: string, name: string, shieldUrl: string, club?: { id?: string, name: string } };
}

// Custom Searchable Combobox Component
const SearchableSelect = ({ options, value, onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filtered = useMemo(() => options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase())), [options, search]);
  const selectedLabel = options.find((o:any) => o.value === value)?.label || placeholder;

  return (
    <div className="searchable-select" onMouseLeave={() => setOpen(false)}>
      <div className="ss-selected" onClick={() => setOpen(!open)}>
        <span>{selectedLabel}</span>
        <span className="ss-caret">▼</span>
      </div>
      {open && (
        <div className="ss-dropdown animate-fade-in">
          <input 
            type="text" 
            autoFocus 
            className="ss-search" 
            placeholder="Buscar..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <div className="ss-options">
            {filtered.map((o: any) => (
              <div 
                key={o.value} 
                className={`ss-option ${o.value === value ? 'active' : ''}`}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setSearch('');
                }}
              >
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && <div className="ss-no-results">Sin resultados</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export function Clasificaciones() {
  const [tab, setTab] = useState<'partidos' | 'clasificacion'>('partidos');
  const [clubId, setClubId] = useState<string>('67'); 
  const [matches, setMatches] = useState<ClupikGame[]>([]);
  const [loading, setLoading] = useState(true);

  // Maintain a dynamic unique list of encountered clubs globally
  const [knownClubs, setKnownClubs] = useState<{id: string, name: string}[]>([{id: '67', name: 'Uros de Rivas'}]);

  // Standings State
  const [dynamicStandings, setDynamicStandings] = useState<StandingTeam[]>([]);
  const [selectedCompKey, setSelectedCompKey] = useState<string>(''); // format: "compId_phaseId_groupId"
  const [loadingStandings, setLoadingStandings] = useState(false);

  // Deep Stats State
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameDetail, setGameDetail] = useState<ClupikGame | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [comparisonStats, setComparisonStats] = useState<{ local: StandingTeam | null, visitor: StandingTeam | null } | null>(null);

  // 1. Fetch Master List
  useEffect(() => {
    const fetchGeneralData = async () => {
      setLoading(true);
      try {
        let fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 6);
        let toDate = new Date();
        toDate.setMonth(toDate.getMonth() + 4);

        const res = await fetch(`https://api.clupik.com/games?clubId=${clubId}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}&firstLoad=false&overrideClubId=${clubId}&expand=localTeam,localTeam.club,visitorTeam,visitorTeam.club,organization,competition,group,stadium`);
        
        if (!res.ok) throw new Error("API error: " + res.status);
        const json = await res.json();
        
        // Ensure array of games from json.games (fixed structure)
        const gamesList: ClupikGame[] = Array.isArray(json) ? json : (json.games || json.data || []);
        
        // Sorting by date descending (newest first)
        gamesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMatches(gamesList);

        // Dynamically append new opponent clubs to the combobox dictionary
        setKnownClubs(prev => {
          const map = new Map(prev.map(c => [c.id, c]));
          gamesList.forEach(m => {
            if (m.localTeam?.club?.id && !map.has(m.localTeam.club.id)) {
              map.set(m.localTeam.club.id, { id: m.localTeam.club.id, name: m.localTeam.club.name || `Club ${m.localTeam.club.id}` });
            }
            if (m.visitorTeam?.club?.id && !map.has(m.visitorTeam.club.id)) {
              map.set(m.visitorTeam.club.id, { id: m.visitorTeam.club.id, name: m.visitorTeam.club.name || `Club ${m.visitorTeam.club.id}` });
            }
          });
          return Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name));
        });

      } catch (err) {
        console.error("Failed to fetch games:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeneralData();
  }, [clubId]);

  // Derived filters
  const pastMatches = useMemo(() => matches.filter(m => m.status === 'finished' || new Date(m.date) < new Date()), [matches]);
  const upcomingMatches = useMemo(() => matches.filter(m => m.status !== 'finished' && new Date(m.date) >= new Date()).reverse(), [matches]); // Soonest first

  // Unique Competitions for Standings Tab
  const getUniqueCompetitions = () => {
    const comps = new Map<string, { compName: string, compId: string, phaseId: string, groupId: string }>();
    matches.forEach(m => {
      if (m.competitionId && m.group && m.groupId) {
        const pId = (m.group as any).phaseId || m.group.phase?.id || '0';
        if (pId) {
          const key = `${m.competitionId}_${pId}_${m.groupId}`;
          if (!comps.has(key)) {
            comps.set(key, {
              compName: `${m.competition?.name || 'Competición'} - ${m.group?.title || ''}`,
              compId: m.competitionId,
              phaseId: pId,
              groupId: m.groupId
            });
          }
        }
      }
    });
    return Array.from(comps.values());
  };
  const compOptions = getUniqueCompetitions();
  const compSelectOptions = compOptions.map(c => ({ value: `${c.compId}_${c.phaseId}_${c.groupId}`, label: c.compName }));

  // Load standings when Competition is selected in tab
  useEffect(() => {
    if (tab === 'clasificacion' && compOptions.length > 0 && !selectedCompKey) {
      setSelectedCompKey(`${compOptions[0].compId}_${compOptions[0].phaseId}_${compOptions[0].groupId}`);
    }
  }, [tab, compOptions, selectedCompKey]);

  useEffect(() => {
    const fetchStandings = async () => {
      if (!selectedCompKey) return;
      setLoadingStandings(true);
      const [compId, phaseId, groupId] = selectedCompKey.split('_');
      try {
        const res = await fetch(`https://api.clupik.com/competitions/${compId}/phases/${phaseId}/groups/${groupId}/standings?expand=team,team.club`);
        const data = await res.json();
        setDynamicStandings(data.standings || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStandings(false);
      }
    };
    fetchStandings();
  }, [selectedCompKey]);

  // Deep match click handler (Master-Detail)
  const handleGameClick = async (gameId: string) => {
    if (selectedGameId === gameId) {
      setSelectedGameId(null);
      setGameDetail(null);
      setComparisonStats(null);
      return;
    }
    
    setSelectedGameId(gameId);
    setLoadingDetail(true);
    setGameDetail(null);
    setComparisonStats(null);

    try {
      // Fetch details using base game ID expansion
      const dp = await fetch(`https://api.clupik.com/games/${gameId}?clubId=${clubId}&navtabs=true&expand=organization,competition,group,group.phase,localTeam,stadium,localTeam.club,visitorTeam,visitorTeam.club&overrideClubId=${clubId}`);
      if (!dp.ok) throw new Error("Stats request failed");
      const gameData: ClupikGame = await dp.json();
      setGameDetail(gameData);

      // Fetch standings for comparative stats
      if (gameData.competitionId && gameData.group && gameData.groupId) {
        // Robust phase resolution for the newly diagnosed structure
        const targetPhaseId = (gameData.group as any).phaseId || gameData.group.phase?.id || '0';
        
        try {
          const stRes = await fetch(`https://api.clupik.com/competitions/${gameData.competitionId}/phases/${targetPhaseId}/groups/${gameData.groupId}/standings?expand=team,team.club`);
          if (stRes.ok) {
            const stJson = await stRes.json();
            const standings = stJson.standings as StandingTeam[] || [];
            
            const localTeamStats = standings.find(s => s.team.id === gameData.localTeamId || s.team.name === gameData.localTeamName) || null;
            const visitorTeamStats = standings.find(s => s.team.id === gameData.visitorTeamId || s.team.name === gameData.visitorTeamName) || null;
            
            setComparisonStats({ local: localTeamStats, visitor: visitorTeamStats });
          }
        } catch(subErr) {
          console.error("Standings compare fetch failed", subErr);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getTeamForm = (teamId: string | undefined, mainMatches: ClupikGame[]) => {
    if (!teamId) return [];
    return mainMatches
      .filter(m => m.status === 'finished' && (m.localTeamId === teamId || m.visitorTeamId === teamId || m.localTeam?.id === teamId || m.visitorTeam?.id === teamId))
      .slice(0, 5) // last 5
      .map(m => {
        const isLocal = m.localTeam?.id === teamId || m.localTeamId === teamId;
        const scored = isLocal ? m.localScore : m.visitorScore;
        const received = isLocal ? m.visitorScore : m.localScore;
        const win = scored >= received; // including draws as positive or just handled as W
        return { win, match: m };
      });
  };

  const handleTeamClick = (e: React.MouseEvent, targetClubId: string | undefined) => {
    e.stopPropagation(); // prevent expanding the match card
    if (targetClubId && targetClubId !== clubId) {
      setClubId(targetClubId);
      setSelectedGameId(null);
    }
  };

  const renderGameList = (title: string, gameArray: ClupikGame[]) => (
    <div className="game-section">
      <h3 className="section-title">{title}</h3>
      <div className="matches-list">
        {gameArray.map((m) => {
          const gameIdToUse = m.id || m.gameId || Math.random().toString();
          const lImg = m.localTeam?.shieldUrl || m.localTeamShieldUrl;
          const vImg = m.visitorTeam?.shieldUrl || m.visitorTeamShieldUrl;
          const lName = m.localTeamEditableName || m.localTeam?.club?.name || m.localTeamName;
          const vName = m.visitorTeamEditableName || m.visitorTeam?.club?.name || m.visitorTeamName;
          
          const localClubId = m.localTeam?.club?.id;
          const visitorClubId = m.visitorTeam?.club?.id;

          return (
            <div key={gameIdToUse} className="match-wrapper">
              <div 
                className={`match-card ${selectedGameId === gameIdToUse ? 'expanded' : ''}`}
                onClick={() => handleGameClick(gameIdToUse)}
              >
                <div className="match-date">
                  {new Date(m.date).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                
                <div className="match-teams">
                  <div 
                    className={`team local-team clickable-team ${m.localScore > m.visitorScore && m.status === 'finished' ? 'winner' : ''}`}
                    onClick={(e) => handleTeamClick(e, localClubId)}
                    title={localClubId ? `Cargar feed del Club ${lName}` : ''}
                  >
                    <span className="team-name">{lName}</span>
                    {lImg && <img src={lImg} alt="shield" className="team-shield" />}
                    {m.status === 'finished' && <span className="team-score">{m.localScore}</span>}
                  </div>
                  
                  <div className="match-vs">VS</div>
                  
                  <div 
                    className={`team visitor-team clickable-team ${m.visitorScore > m.localScore && m.status === 'finished' ? 'winner' : ''}`}
                    onClick={(e) => handleTeamClick(e, visitorClubId)}
                    title={visitorClubId ? `Cargar feed del Club ${vName}` : ''}
                  >
                    {m.status === 'finished' && <span className="team-score">{m.visitorScore}</span>}
                    {vImg && <img src={vImg} alt="shield" className="team-shield" />}
                    <span className="team-name">{vName}</span>
                  </div>
                </div>
                
                <div className="match-status">
                  {m.status === 'finished' ? <span className="badge-played">Final</span> : <span className="badge-scheduled">Próximo</span>}
                </div>
              </div>

              {/* Deep Stats Section */}
              {selectedGameId === gameIdToUse && (
                <div className="match-deep-stats animate-slide-down">
                  {loadingDetail ? (
                    <span className="loading-msg">Mapeando telemetría...</span>
                  ) : gameDetail ? (
                    <div className="comparison-view">
                      <div className="comp-header">
                        <div className="comp-info">
                          <span className="info-label">COMPETICIÓN</span>
                          <span className="info-val">{gameDetail.competition?.name || 'N/D'}</span>
                        </div>
                        <div className="comp-info">
                          <span className="info-label">FASE / GRUPO</span>
                          <span className="info-val">
                            {gameDetail.group?.phase?.title ? `${gameDetail.group.phase.title} • ` : ''}
                            {gameDetail.group?.title}
                          </span>
                        </div>
                      </div>

                      {comparisonStats && comparisonStats.local && comparisonStats.visitor ? (
                        <div className="comparison-bars">
                          <h4 className="cb-title">ESTADÍSTICAS DEL GRUPO</h4>
                          
                          {/* Ganados */}
                          <div className="stat-row">
                            <span className="stat-num">{comparisonStats.local.gamesWon}</span>
                            <div className="bar-wrapper left-bar">
                              <div className="bar-fill" style={{ width: `${(comparisonStats.local.gamesWon / Math.max(comparisonStats.local.gamesPlayed, 1)) * 100}%` }}></div>
                            </div>
                            <span className="stat-type">GANADOS</span>
                            <div className="bar-wrapper right-bar">
                              <div className="bar-fill" style={{ width: `${(comparisonStats.visitor.gamesWon / Math.max(comparisonStats.visitor.gamesPlayed, 1)) * 100}%` }}></div>
                            </div>
                            <span className="stat-num">{comparisonStats.visitor.gamesWon}</span>
                          </div>

                          {/* Perdidos */}
                          <div className="stat-row">
                            <span className="stat-num">{comparisonStats.local.gamesLost}</span>
                            <div className="bar-wrapper left-bar lose-bar">
                              <div className="bar-fill" style={{ width: `${(comparisonStats.local.gamesLost / Math.max(comparisonStats.local.gamesPlayed, 1)) * 100}%` }}></div>
                            </div>
                            <span className="stat-type">PERDIDOS</span>
                            <div className="bar-wrapper right-bar lose-bar">
                              <div className="bar-fill" style={{ width: `${(comparisonStats.visitor.gamesLost / Math.max(comparisonStats.visitor.gamesPlayed, 1)) * 100}%` }}></div>
                            </div>
                            <span className="stat-num">{comparisonStats.visitor.gamesLost}</span>
                          </div>

                           {/* Puntos A Favor */}
                           <div className="stat-row">
                            <span className="stat-num">{comparisonStats.local.pointsScored}</span>
                            <div className="bar-wrapper left-bar">
                              <div className="bar-fill pb-fill" style={{ width: `${Math.min((comparisonStats.local.pointsScored / 1000) * 100, 100)}%` }}></div>
                            </div>
                            <span className="stat-type">A FAVOR</span>
                            <div className="bar-wrapper right-bar">
                              <div className="bar-fill pb-fill" style={{ width: `${Math.min((comparisonStats.visitor.pointsScored / 1000) * 100, 100)}%` }}></div>
                            </div>
                            <span className="stat-num">{comparisonStats.visitor.pointsScored}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="loading-msg">La API no brindó comparativas de la competición.</span>
                      )}

                      {/* Form (Últimos partidos) */}
                      <div className="form-history">
                        <div className="local-form">
                          <span>Últimos</span>
                          <div className="bubbles">
                            {getTeamForm(gameDetail.localTeam?.id || gameDetail.localTeamId, matches).map((f, i) => (
                              <div key={i} className={`form-bubble ${f.win ? 'win' : 'lose'}`} title={`${f.match.localScore} - ${f.match.visitorScore}`}>{f.win ? 'V' : 'D'}</div>
                            ))}
                          </div>
                        </div>
                        <div className="visitor-form">
                          <div className="bubbles">
                            {getTeamForm(gameDetail.visitorTeam?.id || gameDetail.visitorTeamId, matches).map((f, i) => (
                              <div key={i} className={`form-bubble ${f.win ? 'win' : 'lose'}`} title={`${f.match.localScore} - ${f.match.visitorScore}`}>{f.win ? 'V' : 'D'}</div>
                            ))}
                          </div>
                          <span>Partidos</span>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <span className="loading-msg">Métricas en blanco...</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="stands-container">
      <div className="stands-header">
        <h1>Competición en Vivo</h1>
        
        <div className="stands-controls">
          <div className="stands-tabs">
            <button className={`tab-btn ${tab === 'partidos' ? 'active' : ''}`} onClick={() => setTab('partidos')}>Partidos</button>
            <button className={`tab-btn ${tab === 'clasificacion' ? 'active' : ''}`} onClick={() => setTab('clasificacion')}>Clasificación</button>
          </div>
          
          {/* Enhanced Combobox UI for Club Selection */}
          <SearchableSelect 
            options={knownClubs.map(c => ({ value: c.id, label: c.name }))}
            value={clubId}
            onChange={(val: string) => { setClubId(val); setSelectedGameId(null); }}
            placeholder="Seleccionar Club..."
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Desplegando infraestructura de partidos...</div>
      ) : (
        <div className="stands-content animate-slide-up">
          {tab === 'partidos' && (
            <>
              {upcomingMatches.length > 0 && renderGameList("Próximos Partidos", upcomingMatches)}
              {pastMatches.length > 0 && renderGameList("Últimos Resultados", pastMatches)}
              {matches.length === 0 && <div className="no-items">Sin partidos en el radar de fechas limitadas.</div>}
            </>
          )}

          {tab === 'clasificacion' && (
            <div className="standings-wrapper">
              <div className="comp-selector-wrap">
                <SearchableSelect 
                  options={compSelectOptions}
                  value={selectedCompKey}
                  onChange={(val: string) => setSelectedCompKey(val)}
                  placeholder="Elige grupo de clasificación..."
                />
              </div>

              {loadingStandings ? (
                <div className="loading-msg">Calculando estadísticas de grupo...</div>
              ) : dynamicStandings.length > 0 ? (
                <div className="table-responsive">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th>Pos</th>
                        <th>Equipo</th>
                        <th>PJ</th>
                        <th>G</th>
                        <th>P</th>
                        <th>E</th>
                        <th>PF</th>
                        <th>PC</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dynamicStandings.sort((a,b) => a.rankingOrder - b.rankingOrder).map(s => {
                        const isPrimaryClub = s.team?.club?.id === clubId || s.team?.name.toUpperCase().includes('UROS DE RIVAS');
                        return (
                          <tr key={s.team.id || s.rankingOrder} className={isPrimaryClub ? 'row-highlight' : ''}>
                            <td>{s.rankingOrder}</td>
                            <td className="team-col">
                              {s.team.shieldUrl && <img src={s.team.shieldUrl} alt="" className="table-shield"/>}
                              <span>{s.team.name}</span>
                            </td>
                            <td>{s.gamesPlayed}</td>
                            <td>{s.gamesWon}</td>
                            <td>{s.gamesLost}</td>
                            <td>{s.gamesDrawn}</td>
                            <td>{s.pointsScored}</td>
                            <td>{s.pointsReceived}</td>
                            <td className="points-col">{s.rankingPoints}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                 <div className="no-items">No hay clasificaciones disponibles para esta competición.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
