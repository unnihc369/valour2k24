import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import CricketDashboard from "./CricketDashboard";
import TennisDashboard from "./TennisDashboard";
import Cookies from 'js-cookie'; 

const socket = io('https://valour2k24-backend.onrender.com'); 

export default function GameDashboard() {
    const [games, setGames] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const navigate = useNavigate();

    const userRole = Cookies.get('role'); 

    const fetchGames = async () => {
        try {
            const liveResponse = await fetch("https://valour2k24-backend.onrender.com/live");
            const finalResponse = await fetch("https://valour2k24-backend.onrender.com/final");
            const liveData = await liveResponse.json();
            const finalData = await finalResponse.json();

            const mergedGames = [...liveData, ...finalData];
            setGames(mergedGames);
        } catch (error) {
            console.error("Error fetching games:", error);
        }
    };

    useEffect(() => {
        fetchGames();

        socket.on('finalAdded', (newFinal) => {
            setGames((prevGames) => [...prevGames, newFinal]);
        });

        socket.on('finalUpdated', (updatedFinal) => {
            setGames((prevGames) => prevGames.map((game) => (game._id === updatedFinal._id ? updatedFinal : game)));
        });

        socket.on('finalDeleted', (deletedFinal) => {
            setGames((prevGames) => prevGames.filter((game) => game._id !== deletedFinal.id));
        });

        socket.on('liveGameAdded', (newLiveGame) => {
            setGames((prevGames) => [...prevGames, newLiveGame]);
        });

        socket.on('liveGameUpdated', (updatedLiveGame) => {
            setGames((prevGames) => prevGames.map((game) => (game._id === updatedLiveGame._id ? updatedLiveGame : game)));
        });

        socket.on('liveGameDeleted', (deletedLiveGameId) => {
            setGames((prevGames) => prevGames.filter((game) => game._id !== deletedLiveGameId));
        });

        socket.on('matchWinner', (data) => {
            const { winner } = data;
            console.log(winner);
            handleWinner(winner); 
        });

        return () => {
            socket.off('finalAdded');
            socket.off('finalUpdated');
            socket.off('finalDeleted');
            socket.off('liveGameAdded');
            socket.off('liveGameUpdated');
            socket.off('liveGameDeleted');
            socket.off('matchWinner');
        };
    }, []);

    const filterGames = (games) => {
        return games.filter((game) => {
            const teamA = game.teamA || ""; 
            const teamB = game.teamB || ""; 
            const gameName = game.gameName || ""; 

            const teamMatch = selectedTeam === "all" || teamA === selectedTeam || teamB === selectedTeam;
            const searchMatch = teamA.toLowerCase().includes(searchQuery.toLowerCase()) ||
                teamB.toLowerCase().includes(searchQuery.toLowerCase());
            const tabMatch = activeTab === "all" || gameName.toLowerCase() === activeTab.toLowerCase();
            return teamMatch && searchMatch && tabMatch;
        });
    };

    const gameNames = Array.from(new Set(games.map((game) => game.gameName).filter(Boolean))); 

    const deleteGame = async (game) => {
        const endpoint = game.type === "final" ? `https://valour2k24-backend.onrender.com/final/${game._id}` : `https://valour2k24-backend.onrender.com/live/${game._id}`;
        const confirmDelete = window.confirm(`Are you sure you want to delete the game "${game.gameName}"?`);

        if (confirmDelete) {
            try {
                const response = await fetch(endpoint, {
                    method: "DELETE",
                });

                if (response.ok) {
                    setGames((prevGames) => prevGames.filter((g) => g._id !== game._id));
                    alert("Game deleted successfully!");
                } else {
                    alert("Failed to delete game. Please try again.");
                }
            } catch (error) {
                console.error("Error deleting game:", error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-4xl font-bold mb-6">Game Dashboard</h1>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="w-full sm:w-1/3">
                        <label htmlFor="search" className="block text-sm font-medium mb-2">Search Teams</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Search teams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full p-2 bg-gray-800 text-white rounded-lg"
                        />
                    </div>

                    <div className="w-full sm:w-1/3">
                        <label htmlFor="team-filter" className="block text-sm font-medium mb-2">Filter by Team</label>
                        <select
                            id="team-filter"
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            className="block w-full p-2 bg-gray-800 text-white rounded-lg"
                        >
                            <option value="all">All Teams</option>
                            {Array.from(new Set(games.flatMap((game) => [game.teamA, game.teamB]))).map((team,i) => (
                                <option key={i} value={team}>{team}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex overflow-x-auto space-x-4 mb-4">
                    <button
                        className={`px-4 py-2 rounded-lg ${activeTab === "all" ? "bg-gray-700" : "bg-gray-800"}`}
                        onClick={() => setActiveTab("all")}
                    >
                        All
                    </button>
                    {gameNames.map((name) => (
                        <button
                            key={name}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === name ? "bg-gray-700" : "bg-gray-800"}`}
                            onClick={() => setActiveTab(name)}
                        >
                            {name}
                        </button>
                    ))}
                    <button
                        className={`px-4 py-2 rounded-lg ${activeTab === "tennis" ? "bg-gray-700" : "bg-gray-800"}`}
                        onClick={() => setActiveTab("tennis")}
                    >
                        Table Tennis
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg ${activeTab === "cricket" ? "bg-gray-700" : "bg-gray-800"}`}
                        onClick={() => setActiveTab("cricket")}
                    >
                        Cricket
                    </button>
                </div>
            </div>

            {activeTab === "cricket" && <CricketDashboard userRole={userRole} />}
            {activeTab === "tennis" && <TennisDashboard userRole={userRole}/>}

            {/* Games Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                {filterGames(games).map((game) => (
                    <div key={game._id} className="bg-gray-800 text-white rounded-lg p-4 sm:p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg sm:text-xl font-bold">{game.gameName} </h2>
                            <span className={`px-2 py-1 rounded-lg ${game.isLive && !game.winners ? "bg-green-600 animate-pulse" : "bg-gray-600 border border-white"}`}>
                                {game.isLive && !game.winners ? "LIVE" : game.winners ? "Completed" : "Upcoming"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xl sm:text-2xl font-bold mb-4">
                            {game.type !== "final" && <>
                                <div>{game.teamA} {game.winners === game.teamA && "🏆"}</div>
                                <div>-</div>
                                <div>{game.teamB} {game.winners === game.teamB && "🏆"}</div>
                            </>}
                        </div>
                        <div className="text-center text-base sm:text-lg font-semibold">
                            {game.winners && <div>Winner: {game.winners} {game.type === "final" && "🏆"}</div>}
                        </div>
                        {game.type === "final" && (
                            <div className="mt-2 text-sm">
                                {game.runners && <p>Runners-Up: {game.runners}</p>}
                                <p>
                                    Qualified Teams: {game.qualifiedTeams.length === 1 && game.qualifiedTeams[0] === ""
                                        ? "Qualified teams to be announced"
                                        : game.qualifiedTeams.join(", ")}
                                </p>
                            </div>
                        )}
                        <div className="flex justify-between mt-4">
                            {(userRole === "admin" || userRole === game.gameName) && (
                                <button
                                    onClick={() => navigate(game.type === "final" ? `/editfinal/${game._id}` : `/edit/${game._id}`)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                                >
                                    Edit
                                </button>
                            )}

                            {userRole === "admin" && (
                                <button
                                    onClick={() => deleteGame(game)}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
        </div>
    );
}
