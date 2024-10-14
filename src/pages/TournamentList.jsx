import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';

const socket = io('https://valour2k24-backend.onrender.com'); 

function TournamentList() {
    const [tournaments, setTournaments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newTournament, setNewTournament] = useState({
        gameName: '',
        teamNames: [],  // This will hold the array of team names
        currentRound: [],
        nextRound: [],
        champion: null,
    });
    const [newTeamName, setNewTeamName] = useState('');  // For adding a new team name

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const { data } = await axios.get('https://valour2k24-backend.onrender.com/tour'); // Fetch all tournaments
                setTournaments(data);
            } catch (error) {
                console.error('Error fetching tournaments:', error);
            }
        };

        fetchTournaments();
    }, []);

    // Listen for real-time updates via WebSocket
    useEffect(() => {
        socket.on('tournamentCreated', (newTournament) => {
            setTournaments((prevTournaments) => [...prevTournaments, newTournament]);
        });

        socket.on('tournamentUpdated', (updatedTournament) => {
            setTournaments((prevTournaments) =>
                prevTournaments.map((tournament) =>
                    tournament._id === updatedTournament._id ? updatedTournament : tournament
                )
            );
        });

        socket.on('tournamentDeleted', (deletedTournamentId) => {
            setTournaments((prevTournaments) =>
                prevTournaments.filter((tournament) => tournament._id !== deletedTournamentId)
            );
        });

        return () => {
            socket.off('tournamentCreated');
            socket.off('tournamentUpdated');
            socket.off('tournamentDeleted');
        };
    }, []);

    // Handle delete tournament
    const handleDeleteTournament = async (tournamentId) => {
        try {
            await axios.delete(`https://valour2k24-backend.onrender.com/tour/${tournamentId}`);
        } catch (error) {
            console.error('Error deleting tournament:', error);
        }
    };

    // Handle new tournament creation
    const handleCreateTournament = async (e) => {
        e.preventDefault();
        try {
            // Convert teamNames array into an array of team objects
            const teams = newTournament.teamNames.map((teamName) => ({ name: teamName }));

            const tournamentData = {
                gameName: newTournament.gameName,
                teams, // Use the converted teams array
                currentRound: [],
                nextRound: [],
                champion: null,
            };

            const { data } = await axios.post('https://valour2k24-backend.onrender.com/tour', tournamentData);

            setNewTournament({
                gameName: newTournament.gameName,
                teamNames: [],
                currentRound: [],
                nextRound: [],
                champion: null,
            });
        } catch (error) {
            console.error('Error creating tournament:', error);
        }
    };

    // Handle adding a new team to the list
    const handleAddTeam = () => {
        if (newTeamName.trim()) {
            setNewTournament({
                ...newTournament,
                teamNames: [...newTournament.teamNames, newTeamName.trim()],
            });
            setNewTeamName('');  // Clear the input after adding
        }
    };

    // Filter tournaments based on the search term
    const filteredTournaments = tournaments.filter((tournament) =>
        tournament.gameName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
            <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Tournament List
            </h1>

            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
                <input
                    type="text"
                    placeholder="Search Tournaments"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700 text-white border border-gray-600 p-3 rounded-md mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* New Tournament Form */}
            <div className="max-w-md mx-auto mb-8">
                <h2 className="text-2xl font-bold mb-4">Create New Tournament</h2>
                <form onSubmit={handleCreateTournament} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Game Name"
                        value={newTournament.gameName}
                        onChange={(e) => setNewTournament({ ...newTournament, gameName: e.target.value })}
                        className="bg-gray-700 text-white border border-gray-600 p-3 rounded-md w-full"
                    />

                    <div className="flex mb-4">
                        <input
                            type="text"
                            placeholder="Team Name"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="bg-gray-700 text-white border border-gray-600 p-3 rounded-md w-full"
                        />
                        <button
                            type="button"
                            onClick={handleAddTeam}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-md ml-4"
                        >
                            Add Team
                        </button>
                    </div>

                    <div className="mb-4">
                        <ul className="list-disc pl-5">
                            {newTournament.teamNames.map((team, index) => (
                                <li key={index} className="text-white">{team}</li>
                            ))}
                        </ul>
                    </div>

                    <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-md w-full hover:from-blue-600 hover:to-purple-700 transition duration-300 ease-in-out"
                    >
                        Create Tournament
                    </button>
                </form>
            </div>

            {/* Tournament List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments.map((tournament) => (
                    <div key={tournament._id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4">{tournament.gameName}</h3>
                        <Link
                            to={`/tour/${tournament._id}`}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-md w-full mb-4 text-center block hover:from-blue-600 hover:to-purple-700 transition duration-300 ease-in-out"
                        >
                            View Tournament
                        </Link>
                        <button
                            onClick={() => handleDeleteTournament(tournament._id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-md w-full hover:from-red-600 hover:to-red-700 transition duration-300 ease-in-out"
                        >
                            Delete Tournament
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TournamentList;
