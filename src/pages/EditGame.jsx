import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditGame = () => {
    const { id } = useParams();
    const [gameDetails, setGameDetails] = useState({
        gameName: '',
        round: 1,
        winners: '',
        teamA: '',
        teamB: '',
        isLive: false,
        group: false,
    });
    const [isDirty, setIsDirty] = useState(false); // Track if form is dirty
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGameDetails = async () => {
            const response = await fetch(`https://valour2k24-backend.onrender.com/live/${id}`);
            const data = await response.json();
            // Set state only if the data is valid
            if (data) {
                setGameDetails({
                    gameName: data.gameName || '', // Ensure default value
                    round: data.round || 1, // Ensure default value
                    winners: data.winners || '',
                    teamA: data.teamA || '',
                    teamB: data.teamB || '',
                    isLive: data.isLive || false,
                    group: data.group || false,
                });
            }
        };

        fetchGameDetails();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setIsDirty(true); // Mark the form as dirty when any field changes
        setGameDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Map the "winners" field to the correct team name
        const updatedGameDetails = {
            ...gameDetails,
            winners:
                gameDetails.winners === 'teamA'
                    ? gameDetails.teamA
                    : gameDetails.winners === 'teamB'
                        ? gameDetails.teamB
                        : '', // Set empty if no winner selected
        };

        const response = await fetch(`https://valour2k24-backend.onrender.com/live/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedGameDetails),
        });

        if (response.ok) {
            alert('Game details updated successfully!');
            navigate('/game'); // Navigate directly to the game dashboard
        } else {
            alert('Failed to update game details. Please try again.');
        }
    };

    const handleBack = () => {
        if (isDirty) {
            const discard = window.confirm('Are you sure you want to discard the changes?');
            if (discard) {
                navigate('/game');
            }
        } else {
            navigate('/game');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
            <div className="max-w-xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center">Edit Game</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="gameName" className="block mb-2 font-medium">Game Name</label>
                        <input
                            id="gameName"
                            name="gameName"
                            type="text"
                            value={gameDetails.gameName}
                            onChange={handleChange}
                            className="w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="round" className="block mb-2 font-medium">Round</label>
                        <input
                            id="round"
                            name="round"
                            type="number"
                            value={gameDetails.round || ''}
                            onChange={handleChange}
                            className="w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="winners" className="block mb-2 font-medium">Winners</label>
                        <select
                            id="winners"
                            name="winners"
                            value={gameDetails.winners}
                            onChange={handleChange}
                            className="w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Winner</option>
                            <option value="teamA">{gameDetails.teamA || 'Team A'}</option>
                            <option value="teamB">{gameDetails.teamB || 'Team B'}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="teamA" className="block mb-2 font-medium">Team A</label>
                        <input
                            id="teamA"
                            name="teamA"
                            type="text"
                            value={gameDetails.teamA || ''}
                            onChange={handleChange}
                            className="w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="teamB" className="block mb-2 font-medium">Team B</label>
                        <input
                            id="teamB"
                            name="teamB"
                            type="text"
                            value={gameDetails.teamB || ''}
                            onChange={handleChange}
                            className="w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            id="isLive"
                            name="isLive"
                            type="checkbox"
                            checked={gameDetails.isLive}
                            onChange={(e) => setGameDetails({ ...gameDetails, isLive: e.target.checked })}
                            className="mr-2"
                        />
                        <label htmlFor="isLive" className="font-medium">Is Live</label>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="group"
                            name="group"
                            type="checkbox"
                            checked={gameDetails.group}
                            onChange={(e) => setGameDetails({ ...gameDetails, group: e.target.checked })}
                            className="mr-2"
                        />
                        <label htmlFor="group" className="font-medium">Group</label>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            Update Game
                        </button>
                        <button
                            type="button"
                            onClick={handleBack}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            Back
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditGame;
