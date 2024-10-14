import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('https://valour2k24-backend.onrender.com'); 

function Tournament() {
    const [gameName, setGameName] = useState('');
    const [teamNames, setTeamNames] = useState('');
    const [teams, setTeams] = useState([]);
    const [currentRound, setCurrentRound] = useState([]);
    const [nextRound, setNextRound] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [champion, setChampion] = useState(null);

    // Load from local storage if available
    useEffect(() => {
        const savedData = JSON.parse(localStorage.getItem('tournamentData'));
        if (savedData) {
            setTeams(savedData.teams || []);
            setRounds(savedData.rounds || []);
            setCurrentRound(savedData.currentRound || []);
            setNextRound(savedData.nextRound || []);
            setGameName(savedData.gameName || '');
            setChampion(savedData.champion || null); // Load champion if it exists in storage
        }
    }, []);

    // Listen for winner updates from the backend via socket.io
    useEffect(() => {
        socket.on('winnerUpdated', (winners) => {
            handleWinner(winners); // Handle the winner update
        });

        return () => {
            socket.off('winnerUpdated');
        };
    }, [currentRound, nextRound, champion]);

    // Save to local storage on state change
    useEffect(() => {
        if (teams.length || rounds.length || currentRound.length || nextRound.length || gameName || champion) {
            localStorage.setItem(
                'tournamentData',
                JSON.stringify({ teams, rounds, currentRound, nextRound, gameName, champion })
            );
        }
    }, [teams, rounds, currentRound, nextRound, gameName, champion]);

    // Generate matches for the current round
    const generateMatches = (teams) => {
        const newRound = [];
        const advancingTeams = [];

        for (let i = 0; i < teams.length; i += 2) {
            if (i + 1 < teams.length) {
                newRound.push([teams[i], teams[i + 1]]); // Create match pairs
            } else {
                advancingTeams.push(teams[i]); // Bye case
            }
        }

        return { newRound, advancingTeams };
    };

    // Send matches to backend
    const sendMatchesToBackend = async (matches, roundNumber) => {
        try {
            for (const match of matches) {
                await axios.post('https://valour2k24-backend.onrender.com/live', {
                    gameName: gameName,
                    round: roundNumber, // Dynamically send the correct round number
                    teamA: match[0],
                    teamB: match[1],
                    isLive: true,
                });
            }
        } catch (error) {
            console.error("Error sending matches to backend:", error);
        }
    };

    // Start the tournament
    const startTournament = () => {
        const teamList = teamNames.split(',').map((name) => name.trim()).filter(Boolean);
        const teamsWithStatus = teamList.map((name) => ({ name, status: 'In' })); // Set initial status as 'In'
        setTeams(teamsWithStatus);
        const firstRound = generateMatches(teamsWithStatus.map(team => team.name));
        setCurrentRound(firstRound.newRound);
        setRounds([firstRound.newRound]);
        setNextRound(firstRound.advancingTeams);
        setChampion(null); // Reset champion when starting a new tournament

        // Send the generated matches for the first round to the backend
        sendMatchesToBackend(firstRound.newRound, 1); // Pass the round number dynamically
    };

    const handleWinner = (winner) => {
        console.log(winner);
        const winnerMatch = currentRound.find((match) => match.includes(winner));

        if (!winnerMatch) {
            console.error('Match not found for the winner:', winner);
            return;
        }
        const remainingMatches = currentRound.filter((match) => !match.includes(winner));
        const losingTeam = winnerMatch.find((team) => team !== winner);

        if (losingTeam) {
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
                setChampion(allAdvancingTeams[0]);
                return;
            }

            const { newRound, advancingTeams } = generateMatches(allAdvancingTeams);

            if (newRound.length === 0 && advancingTeams.length > 0) {
                alert(`${advancingTeams[0]} gets a bye to the next round!`);
            }

            setRounds((prev) => [...prev, newRound]);
            setCurrentRound(newRound);
            setNextRound(advancingTeams);

            // **Send matches of the next round to the backend**
            sendMatchesToBackend(newRound, rounds.length + 1); // Pass the correct round number
        } else {
            setCurrentRound(remainingMatches);
        }
    };

    // Reset the tournament
    const resetTournament = () => {
        setTeams([]);
        setCurrentRound([]);
        setNextRound([]);
        setRounds([]);
        setGameName('');
        setTeamNames('');
        setChampion(null); // Reset champion
        localStorage.removeItem('tournamentData');
    };

    // Real-time socket update to listen for match winner updates
    useEffect(() => {
        socket.on('matchWinner', (data) => {
            const { winner } = data;
            handleWinner(winner);
        });

        return () => {
            socket.off('matchWinner');
        };
    }, [currentRound, nextRound, champion]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
            <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Tournament
            </h1>

            {!teams.length ? (
                <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
                    <input
                        type="text"
                        placeholder="Enter Game Name"
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        className="bg-gray-700 text-white border border-gray-600 p-3 rounded-md mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Enter Team Names (comma-separated)"
                        value={teamNames}
                        onChange={(e) => setTeamNames(e.target.value)}
                        className="bg-gray-700 text-white border border-gray-600 p-3 rounded-md mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={startTournament}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-md w-full hover:from-blue-600 hover:to-purple-700 transition duration-300 ease-in-out transform hover:-translate-y-1"
                    >
                        Start Tournament
                    </button>
                </div>
            ) : (
                <div>
                    <h2 className="text-3xl font-bold mb-6 text-center">
                        <span className="text-blue-400">{gameName}</span>
                    </h2>

                    {champion && (
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg mb-8 text-center animate-pulse">
                            <h3 className="text-2xl font-bold">
                                🏆 {champion} is the Champion of {gameName}! 🏆
                            </h3>
                        </div>
                    )}

                    {/* Clear current round matches if a champion is set */}
                    {!champion && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {currentRound.map((match, index) => (
                                <MatchCard key={index} match={match} onWin={handleWinner} />
                            ))}
                        </div>
                    )}

                    <button
                        onClick={resetTournament}
                        className="mx-auto bg-gradient-to-r from-red-500 to-red-600 w-[240px] text-white py-3 px-6 rounded-md hover:from-red-600 hover:to-red-700 transition duration-300 ease-in-out transform hover:-translate-y-1 block"
                    >
                        Reset Tournament
                    </button>


                    <TournamentProgress rounds={rounds} teams={teams} />
                </div>
            )}
        </div>
    );
}

function MatchCard({ match, onWin }) {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-center">
                {match[0]} <span className="text-gray-400">vs</span> {match[1]}
            </h3>
            <div className="flex justify-between">
                <button
                    onClick={() => onWin(match[0])}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-md hover:from-green-600 hover:to-green-700 transition duration-300 ease-in-out transform hover:-translate-y-1 flex-1 mr-2"
                >
                    {match[0]} Wins
                </button>
                <button
                    onClick={() => onWin(match[1])}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-md hover:from-green-600 hover:to-green-700 transition duration-300 ease-in-out transform hover:-translate-y-1 flex-1 ml-2"
                >
                    {match[1]} Wins
                </button>
            </div>
        </div>
    );
}

function TournamentProgress({ rounds, teams }) {
    return (
        <div className="space-y-8 mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rounds.map((round, index) => (
                    <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h4 className="text-xl font-bold mb-4">Round {index + 1}</h4>
                        <div className="space-y-2">
                            {round.map((match, matchIndex) => (
                                <p key={matchIndex} className="text-gray-300">
                                    {match[0]} <span className="text-gray-500">vs</span> {match[1]}
                                </p>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h4 className="text-xl font-bold mb-4">Team Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                        <div key={team.name} className="p-4 bg-gray-700 rounded-md shadow border border-gray-600">
                            <h4 className="text-lg font-bold text-gray-100">{team.name}</h4>
                            <p className={`text-sm ${team.status === 'In' ? 'text-green-400' : 'text-red-400'}`}>
                                {team.status}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Tournament;
