import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditFinal = () => {
    const { id } = useParams();
    const [finalDetails, setFinalDetails] = useState({
        gameName: '',
        winners: '',
        runners: '',
        qualifiedTeams: [],
        isLive: false,
        type: 'final',
    });
    const [isDirty, setIsDirty] = useState(false); // Track if form is dirty
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFinalDetails = async () => {
            const response = await fetch(`https://valour2k24-backend.onrender.com/final/${id}`);
            const data = await response.json();
            // Set state only if the data is valid
            if (data) {
                setFinalDetails({
                    gameName: data.gameName || '',
                    winners: data.winners || '',
                    runners: data.runners || '',
                    qualifiedTeams: data.qualifiedTeams || [],
                    isLive: data.isLive || false,
                    type: data.type || 'final',
                });
            }
        };

        fetchFinalDetails();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setIsDirty(true); // Mark the form as dirty when any field changes
        setFinalDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setIsDirty(true); // Mark the form as dirty when checkbox changes
        setFinalDetails((prevDetails) => ({
            ...prevDetails,
            [name]: checked,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`https://valour2k24-backend.onrender.com/final/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalDetails),
        });

        if (response.ok) {
            alert('Final details updated successfully!');
            navigate('/game'); 
        } else {
            alert('Failed to update final details. Please try again.');
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
                <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center">Edit Final</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="gameName" className="block mb-2 font-medium">Game Name</label>
                        <input
                            id="gameName"
                            name="gameName"
                            type="text"
                            value={finalDetails.gameName}
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
                            value={finalDetails.winners}
                            onChange={handleChange}
                            className="w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Winner</option>
                            <option value="teamA">Team A</option>
                            <option value="teamB">Team B</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="runners" className="block mb-2 font-medium">Runners</label>
                        <select
                            id="runners"
                            name="runners"
                            value={finalDetails.runners}
                            onChange={handleChange}
                            className="w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Runner</option>
                            <option value="teamA">Team A</option>
                            <option value="teamB">Team B</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="qualifiedTeams" className="block mb-2 font-medium">Qualified Teams (Comma Separated)</label>
                        <input
                            id="qualifiedTeams"
                            name="qualifiedTeams"
                            type="text"
                            value={finalDetails.qualifiedTeams.join(', ')} // Display as comma-separated values
                            onChange={(e) => {
                                const teams = e.target.value.split(',').map(team => team.trim());
                                setIsDirty(true); // Mark the form as dirty
                                setFinalDetails((prevDetails) => ({
                                    ...prevDetails,
                                    qualifiedTeams: teams,
                                }));
                            }}
                            className="w-full p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            id="isLive"
                            name="isLive"
                            type="checkbox"
                            checked={finalDetails.isLive}
                            onChange={handleCheckboxChange}
                            className="mr-2"
                        />
                        <label htmlFor="isLive" className="font-medium">Is Live</label>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            Update Final
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

export default EditFinal;
