import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('https://valour2k24-backend.onrender.com');

export default function CricketDashboard({ userRole }) {
    const [matches, setMatches] = useState([]);
    const [formData, setFormData] = useState({
        teamA: '',
        teamB: '',
        scores: { teamA: '', teamB: '' },
        wickets: { teamA: '', teamB: '' },
        overs: { teamA: '', teamB: '' },
        isLive: false,
        winners: '',
    });
    const [editingMatchId, setEditingMatchId] = useState(null); // null means we're adding a new match

    useEffect(() => {
        // Fetch initial matches from the backend
        fetch('https://valour2k24-backend.onrender.com/cricket')
            .then((response) => response.json())
            .then((data) => setMatches(data))
            .catch((error) => console.error('Error fetching matches:', error));

        // Listen for real-time updates
        socket.on('matchUpdated', (updatedMatch) => {
            setMatches((prevMatches) =>
                prevMatches.map((match) =>
                    match._id === updatedMatch._id ? updatedMatch : match
                )
            );
        });

        return () => {
            socket.off('matchUpdated');
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('scores') || name.startsWith('wickets') || name.startsWith('overs')) {
            const [category, team] = name.split('.');
            setFormData((prevData) => ({
                ...prevData,
                [category]: {
                    ...prevData[category],
                    [team]: value,
                },
            }));
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingMatchId) {
            // Update match
            fetch(`https://valour2k24-backend.onrender.com/cricket/${editingMatchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
                .then((response) => response.json())
                .then((updatedMatch) => {
                    setMatches((prevMatches) =>
                        prevMatches.map((match) =>
                            match._id === editingMatchId ? updatedMatch : match
                        )
                    );
                    setEditingMatchId(null);
                    resetForm();
                })
                .catch((error) => console.error('Error updating match:', error));
        } else {
            // Add new match
            fetch('https://valour2k24-backend.onrender.com/cricket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
                .then((response) => response.json())
                .then((newMatch) => {
                    setMatches((prevMatches) => [...prevMatches, newMatch]);
                    resetForm();
                })
                .catch((error) => console.error('Error adding match:', error));
        }
    };

    const handleEdit = (match) => {
        setEditingMatchId(match._id);
        setFormData({
            teamA: match.teamA,
            teamB: match.teamB,
            scores: match.scores,
            wickets: match.wickets,
            overs: match.overs,
            isLive: match.isLive,
            winners: match.winners,
        });
    };

    const deleteMatch = (matchId) => {
        fetch(`https://valour2k24-backend.onrender.com/cricket/${matchId}`, { method: 'DELETE' })
            .then(() => {
                setMatches(matches.filter((match) => match._id !== matchId));
            })
            .catch((error) => console.error('Error deleting match:', error));
    };

    const resetForm = () => {
        setFormData({
            teamA: '',
            teamB: '',
            scores: { teamA: 0, teamB: 0 },
            wickets: { teamA: 0, teamB: 0 },
            overs: { teamA: 0, teamB: 0 },
            isLive: false,
            winners: '',
        });
        setEditingMatchId(null);
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
                                name="scores.teamA"
                                placeholder="Score A"
                                value={formData.scores.teamA}
                                onChange={handleChange}
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                name="scores.teamB"
                                placeholder="Score B"
                                value={formData.scores.teamB}
                                onChange={handleChange}
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                name="wickets.teamA"
                                placeholder="Wickets A"
                                value={formData.wickets.teamA}
                                onChange={handleChange}
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                name="wickets.teamB"
                                placeholder="Wickets B"
                                value={formData.wickets.teamB}
                                onChange={handleChange}
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                name="overs.teamA"
                                placeholder="Overs A"
                                value={formData.overs.teamA}
                                onChange={handleChange}
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                name="overs.teamB"
                                placeholder="Overs B"
                                value={formData.overs.teamB}
                                onChange={handleChange}
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                        </div>
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                name="isLive"
                                checked={formData.isLive}
                                onChange={(e) => setFormData({ ...formData, isLive: e.target.checked })}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span>Is Live</span><input
                                type="text"
                                name="winners"
                                placeholder="Winner (If Any)"
                                value={formData.winners}
                                onChange={handleChange}
                                required
                                className="p-2 rounded-lg bg-gray-700 text-white"
                            />
                        </label>
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
                                    {`${match.teamA} vs ${match.teamB}`}
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

                            <div className="mt-4 text-sm">
                                {/* Display team scores, wickets, and overs in a structured, clear layout */}
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex-1 text-center">
                                        <p className="text-lg font-semibold">
                                            {match.scores.teamA}{' '}
                                            <span className="text-xs">
                                                {' '}/ {match.wickets.teamA}{' '}
                                            </span>
                                        </p>
                                        <span className="text-xs">
                                            ({match.overs.teamA} overs)
                                        </span>
                                    </div>
                                    <div className="text-xl font-bold mx-2">vs</div>
                                    <div className="flex-1 text-center">
                                        <p className="text-lg font-semibold">
                                            {match.scores.teamB}{' '}
                                            <span className="text-xs">
                                                {' '}/ {match.wickets.teamB}
                                            </span>
                                        </p>
                                        <span className="text-xs">
                                            ({match.overs.teamB} overs)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between mt-4">
                                {(userRole === 'admin' || userRole === match.teamA || userRole === match.teamB) && (
                                    <button
                                        onClick={() => handleEdit(match)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                                    >
                                        Edit
                                    </button>
                                )}

                                {userRole === 'admin' && (
                                    <button
                                        onClick={() => deleteMatch(match._id)}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
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
