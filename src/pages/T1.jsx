import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('https://valour2k24-backend.onrender.com'); 

function Tournament() {
    const { id } = useParams();
    const [gameName, setGameName] = useState('');
    const [teams, setTeams] = useState([]);
    const [currentRound, setCurrentRound] = useState([]);
    const [nextRound, setNextRound] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [champion, setChampion] = useState(null);
    const [loading, setLoading] = useState(true); 
    const [roundStatus, setRoundStatus] = useState('Ongoing');
    const initialized = useRef(false); 

    // Use a ref to track if the tournament has started
    const hasStarted = useRef(false); 

    useEffect(() => {
        const fetchTournamentDetails = async () => {
            try {
                const response = await fetch(`https://valour2k24-backend.onrender.com/tour/${id}`);
                const data = await response.json();

                if (data.gameName) {
                    setGameName(data.gameName);
                } else {
                    console.error('Error: Game name is missing in the backend data.');
                }

                // Set initial states from the fetched tournament data
                setTeams(data.teams || []);
                setRounds(data.rounds || []);
                setCurrentRound(data.currentRound || []);
                setNextRound(data.nextRound || []);
                setChampion(data.champion || null);
                setRoundStatus(data.roundStatus || 'Ongoing');
                setLoading(false);
                

                if (!data.currentRound?.length && !data.champion && data.teams?.length && !hasStarted.current) {
                    startTournamentFromDatabase(data.gameName, data.teams);
                    hasStarted.current = true;  // Mark as started
                }

                setFet(true);
                
            } catch (error) {
                console.error('Error fetching tournament details:', error);
                setLoading(false);
            }
        };

        fetchTournamentDetails();
    }, [id]);


    useEffect(() => {
        socket.on('winnerUpdated', (winners) => {
            handleWinner(winners);
        });

        return () => {
            socket.off('winnerUpdated');
        };
    }, [currentRound, nextRound, champion]);

    const generateMatches = (teams) => {
        const newRound = [];
        const advancingTeams = [];

        for (let i = 0; i < teams.length; i += 2) {
            if (i + 1 < teams.length) {
                newRound.push([teams[i], teams[i + 1]]);
            } else {
                advancingTeams.push(teams[i]); 
            }
        }

        return { newRound, advancingTeams };
    };

    const sendMatchesToBackend = async (matches, roundNumber, gameName) => {
        if (!gameName) {
            console.error('Error: gameName is not available. Aborting match submission.');
            return; 
        }

        try {
            for (const match of matches) {
                await fetch('https://valour2k24-backend.onrender.com/live', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        gameName: gameName,
                        round: roundNumber,
                        teamA: match[0],
                        teamB: match[1],
                        isLive: true,
                    }),
                });
            }
        } catch (error) {
            console.error('Error sending matches to backend:', error);
        }
    };

    const handleWinner = async (winner) => {
        const winnerMatch = currentRound.find((match) => match.includes(winner));

        if (!winnerMatch) {
            console.error('Match not found for the winner:', winner);
            return;
        }

        const remainingMatches = currentRound.filter((match) => !match.includes(winner));
        const losingTeam = winnerMatch.find((team) => team !== winner);

        if (losingTeam) {
            // Mark the losing team as 'Out'
            setTeams((prevTeams) =>
                prevTeams.map((team) =>
                    team.name === losingTeam ? { ...team, status: 'Out' } : team
                )
            );
        }

        setNextRound((prev) => [...prev, winner]);

        if (remainingMatches.length === 0) {
            const allAdvancingTeams = [...nextRound, winner];

            if (allAdvancingTeams.length === 1) {
                // Declare the champion
                const champion = allAdvancingTeams[0];

                // Update all teams: the winner becomes "Champion", others are "Out"
                setTeams((prevTeams) =>
                    prevTeams.map((team) =>
                        team.name === champion
                            ? { ...team, status: 'Champion' }
                            : { ...team, status: 'Out' }
                    )
                );

                setChampion(champion);
                setCurrentRound([]);  // Clear current round
                setRoundStatus('Completed');

                // Update the backend with the final status
                try {
                    await fetch(`https://valour2k24-backend.onrender.com/tour/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            gameName,
                            teams, // Send updated teams with their new statuses
                            currentRound: [],
                            nextRound: [],
                            champion: champion,
                            roundStatus: 'Completed', // Mark the round as completed
                        }),
                    });
                } catch (error) {
                    console.error('Error updating the champion and teams in the backend:', error);
                }

                return;
            }

            const { newRound, advancingTeams } = generateMatches(allAdvancingTeams);

            if (newRound.length === 0 && advancingTeams.length > 0) {
                alert(`${advancingTeams[0]} gets a bye to the next round!`);
            }

            setRounds((prev) => [...prev, newRound]);
            setCurrentRound(newRound);
            setNextRound(advancingTeams);

            // Only send new matches to the backend when the round is updated
            try {
                // Avoid calling it twice by doing it after the new round is set
                await sendMatchesToBackend(newRound, rounds.length + 1, gameName);
            } catch (error) {
                console.error('Error sending matches to backend:', error);
            }

            // Update the backend with the new round, team statuses, and round status
            try {
                await fetch(`https://valour2k24-backend.onrender.com/tour/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        gameName,
                        teams, // Updated teams with statuses
                        currentRound: newRound,
                        nextRound: advancingTeams,
                        champion: null,
                        roundStatus: 'Ongoing', // New round is ongoing
                    }),
                });
            } catch (error) {
                console.error('Error updating the tournament round in the backend:', error);
            }
        } else {
            setCurrentRound(remainingMatches);

            // Update the backend with the remaining matches and statuses
            try {
                await fetch(`https://valour2k24-backend.onrender.com/tour/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        gameName,
                        teams,
                        currentRound: remainingMatches,
                        nextRound,
                        champion: null,
                        roundStatus: 'Ongoing', // Current round is still ongoing
                    }),
                });
            } catch (error) {
                console.error('Error updating the tournament round in the backend:', error);
            }
        }
    };

    const startTournamentFromDatabase = async (gameName, dbTeams) => {
        if (!gameName) {
            console.error('Error: gameName is not available. Aborting tournament start.');
            return;
        }

        const teamsWithStatus = dbTeams.map((team) => {
            if (typeof team === 'string') {
                return { name: team.trim(), status: 'In' };
            } else if (typeof team === 'object' && team.name) {
                return { name: team.name.trim(), status: team.status || 'In' };
            } else {
                console.error('Invalid team structure:', team);
                return null;
            }
        }).filter(Boolean);

        setTeams(teamsWithStatus);

        const firstRound = generateMatches(teamsWithStatus.map((team) => team.name));

        setCurrentRound(firstRound.newRound);
        setRounds([firstRound.newRound]);
        setNextRound(firstRound.advancingTeams);
        setChampion(null);

        try {
            await sendMatchesToBackend(firstRound.newRound, 1, gameName);

            await fetch(`https://valour2k24-backend.onrender.com/tour/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameName,
                    teams: teamsWithStatus,
                    currentRound: firstRound.newRound,
                    nextRound: firstRound.advancingTeams,
                    roundStatus: 'Ongoing',
                }),
            });
        } catch (error) {
            console.error('Error starting the tournament:', error);
        }
    };


    const resetTournament = () => {
        setTeams([]);
        setCurrentRound([]);
        setNextRound([]);
        setRounds([]);
        setChampion(null);
        setRoundStatus('Ongoing');
    };

    return (
        <div className="container mx-auto px-4">
            {loading ? (
                <div className="text-center py-10">
                    <div className="spinner"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            ) : (
                <div>
                    {!gameName ? (
                        <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
                            <p className="text-center text-gray-400">
                                Tournament will start automatically with teams from the database.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-3xl font-bold mb-6 text-center">
                                <span className="text-blue-400">{gameName}</span> Tournament
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                    <h3 className="text-2xl font-bold mb-4 text-blue-300">Teams</h3>
                                    <ul className="space-y-2">
                                        {teams.map((team, index) => (
                                            <li key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded-lg">
                                                <span>{team.name}</span>
                                                <span
                                                    className={`${team.status === 'Champion'
                                                        ? 'text-yellow-400'
                                                        : team.status === 'Out'
                                                            ? 'text-red-500'
                                                            : 'text-green-400'
                                                        }`}
                                                >
                                                    {team.status}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                    <h3 className="text-2xl font-bold mb-4 text-blue-300">Current Round</h3>
                                    {currentRound.length ? (
                                        <ul className="space-y-4">
                                            {currentRound.map((match, index) => (
                                                <li key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                                                    <span>{match[0]}</span>
                                                    <span className="text-gray-400">vs</span>
                                                    <span>{match[1]}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-center text-gray-400">No matches this round.</p>
                                    )}
                                </div>

                                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                    <h3 className="text-2xl font-bold mb-4 text-blue-300">Tournament Status</h3>
                                    <p className="text-xl mb-2">
                                        Champion: <span className="text-yellow-400">{champion || 'TBD'}</span>
                                    </p>
                                    <p className="text-xl">
                                        Round Status: <span className="text-purple-400">{roundStatus}</span>
                                    </p>
                                </div>
                            </div>

                            {champion ? (
                                <div className="text-center">
                                    <button
                                        className="bg-purple-600 text-white py-2 px-4 rounded-lg shadow-md"
                                        onClick={resetTournament}
                                    >
                                        Reset Tournament
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Tournament;
