import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie'; // Make sure to install js-cookie

export default function Login() {
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Initialize the useNavigate hook

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !username) {
            setError('Both fields are required!');
            return;
        }

        try {
            const response = await fetch('https://valour2k24-backend.onrender.com/users/login', { // Adjust the URL to your login endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed! Please check your credentials.');
            }

            const data = await response.json();
            console.log('Login successful:', data);

            // Set the cookies for user, token, and role
            Cookies.set('user', username, { expires: 1, secure: true });
            Cookies.set('token', data.token, { expires: 1, secure: true });
            Cookies.set('role', data.user.role, { expires: 1, secure: true });

            // Redirect to the /game route after successful login
            navigate('/game'); // Redirect to /game

        } catch (error) {
            console.error(error);
            setError(error.message);
        }
    };

    return (
        <>
        <Link to="/game">
            <button
                type="button"
                className="mx-4 w-36 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
                Back
            </button>
        </Link >
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-white text-center mb-6">Login</h2>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-600 text-white p-2 mb-4 rounded">
                            {error}
                        </div>
                    )}
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded transition duration-300"
                    >
                        Sign In
                    </button>
                </form>
                <div className="mt-6 text-center">
                    {/* <p className="text-gray-400">
                        Don't have an account?{' '}
                        <a href="#" className="text-blue-400 hover:underline">
                            Sign up
                        </a>
                    </p> */}
                </div>
            </div>
        </div>
        </>
    );
}
