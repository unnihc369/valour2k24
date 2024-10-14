import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://valour2k24-backend.onrender.com'); // Adjust this based on your server

export default function TennisDashboard({ userRole }) {
    const [matches, setMatches] = useState([]);
    const [formData, setFormData] = useState({
        winners: '',
        round: '',
        teamA: '',
        teamB: '',
        scoreA: '',
        scoreB: '',
        isLive: false,
    });
    const [editingMatchId, setEditingMatchId] = useState(null);

    // Fetch tennis matches
    const fetchMatches = async () => {
        try {
            const response = await fetch('https://valour2k24-backend.onrender.com/tennis');
            const data = await response.json();
            setMatches(data);
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    };

    useEffect(() => {
        fetchMatches();

        // WebSocket listeners for real-time updates
        socket.on('tennisMatchCreated', (newMatch) => {
            setMatches((prevMatches) => [...prevMatches, newMatch]);
        });

        socket.on('tennisMatchUpdated', (updatedMatch) => {
            setMatches((prevMatches) =>
                prevMatches.map((match) =>
                    match._id === updatedMatch._id ? updatedMatch : match
                )
            );
        });

        socket.on('tennisMatchDeleted', (deletedMatchId) => {
            setMatches((prevMatches) => prevMatches.filter((match) => match._id !== deletedMatchId));
        });

        return () => {
            socket.off('tennisMatchCreated');
            socket.off('tennisMatchUpdated');
            socket.off('tennisMatchDeleted');
        };
    }, []);

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    // Add or edit a match
    const handleSubmit = async (e) => {
        e.preventDefault();
        const matchData = {
            winners: formData.winners,
            round: formData.round,
            teamA: formData.teamA,
            teamB: formData.teamB,
            scores: {
                teamA: formData.scoreA,
                teamB: formData.scoreB,
            },
            isLive: formData.isLive,
        };

        if (editingMatchId) {
            // Edit match
            try {
                const response = await fetch(`https://valour2k24-backend.onrender.com/tennis/${editingMatchId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(matchData),
                });
                const updatedMatch = await response.json();
                setEditingMatchId(null);
                setFormData({ winners: '', round: '', teamA: '', teamB: '', scoreA: 0, scoreB: 0, isLive: false });
                fetchMatches(); // Refresh matches list after edit
            } catch (error) {
                console.error('Error updating match:', error);
            }
        } else {
            // Add match
            try {
                const response = await fetch('https://valour2k24-backend.onrender.com/tennis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(matchData),
                });
                await response.json();
                setFormData({ winners: '', round: '', teamA: '', teamB: '', scoreA: 0, scoreB: 0, isLive: false });
                fetchMatches(); // Refresh matches list after add
            } catch (error) {
                console.error('Error adding match:', error);
            }
        }
    };

    // Delete a match
    const handleDelete = async (matchId) => {
        try {
            await fetch(`https://valour2k24-backend.onrender.com/tennis/${matchId}`, {
                method: 'DELETE',
            });
            fetchMatches(); // Refresh matches list after delete
        } catch (error) {
            console.error('Error deleting match:', error);
        }
    };

    // Start editing a match
    const handleEdit = (match) => {
        setEditingMatchId(match._id);
        setFormData({
            winners: match.winners || '',
            round: match.round,
            teamA: match.teamA,
            teamB: match.teamB,
            scoreA: match.scores.teamA,
            scoreB: match.scores.teamB,
            isLive: match.isLive,
        });
    };

    return (
        <div className="mx-auto">
            {/* Form for adding/editing matches */}
            {(userRole === 'admin' || userRole === 'editor') && (
                <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg mb-8 lg:mx-64">
                    <h2 className="text-2xl font-bold mb-4">
                        {editingMatchId ? 'Edit Match' : 'Add New Match'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="teamA"
                                placeholder="Team A"
                                value={formData.teamA}
                                onChange={handleChange}
                                required
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="text"
                                name="teamB"
                                placeholder="Team B"
                                value={formData.teamB}
                                onChange={handleChange}
                                required
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                name="scoreA"
                                placeholder="Score A"
                                value={formData.scoreA}
                                onChange={handleChange}
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                name="scoreB"
                                placeholder="Score B"
                                value={formData.scoreB}
                                onChange={handleChange}
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="text"
                                name="winners"
                                placeholder="Winners (If Any)"
                                value={formData.winners}
                                onChange={handleChange}
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                name="round"
                                placeholder="Round"
                                value={formData.round}
                                onChange={handleChange}
                                required
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    name="isLive"
                                    checked={formData.isLive}
                                    onChange={(e) => setFormData({ ...formData, isLive: e.target.checked })}
                                    className="form-checkbox h-5 w-5 text-blue-600"
                                />
                                <span>Is Live</span>
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                        >
                            {editingMatchId ? 'Update Match' : 'Add Match'}
                        </button>
                    </form>
                </div>
            )}

            {/* List of matches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                {matches.length === 0 ? (
                    <p className="text-center">No matches available</p>
                ) : (
                    matches.map((match) => (
                        <div
                            key={match._id}
                            className="bg-gray-800 text-white rounded-lg p-4 sm:p-6 shadow-lg"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg sm:text-xl font-bold">
                                    {match.teamA} vs {match.teamB}
                                </h2>
                                <span
                                    className={`px-2 py-1 rounded-lg ${match.isLive && !match.winners
                                        ? 'bg-green-600 animate-pulse'
                                        : 'bg-gray-600 border border-white'
                                        }`}
                                >
                                    {match.isLive && !match.winners
                                        ? 'LIVE'
                                        : match.winners
                                            ? 'Completed'
                                            : 'Upcoming'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-xl sm:text-2xl font-bold mb-4">
                                <div>
                                    {match.teamA} {match.winners === match.teamA && '🏆'}
                                </div>
                                <div>-</div>
                                <div>
                                    {match.teamB} {match.winners === match.teamB && '🏆'}
                                </div>
                            </div>

                            {match.winners && (
                                <div className="text-center text-base sm:text-lg font-semibold">
                                    Winner: {match.winners}
                                </div>
                            )}

                            <div className="mt-2 text-sm">
                                <p><strong>Scores:</strong> {match.scores.teamA} - {match.scores.teamB}</p>
                            </div>

                            <div className="flex justify-between mt-4">
                                {(userRole === 'admin' || userRole === 'editor') && (
                                    <button
                                        onClick={() => handleEdit(match)}
                                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                                    >
                                        Edit
                                    </button>
                                )}
                                {userRole === 'admin' && (
                                    <button
                                        onClick={() => handleDelete(match._id)}
                                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
