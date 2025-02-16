import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";

const UserProfile = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [error, setError] = useState(null);
    const [token, , username] = useContext(UserContext); // Get the token from context

    const [exerciseName, setExerciseName] = useState("");
    const [attribute, setAttribute] = useState("");
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const [exercises, setExercises] = useState({});
    const [chartUrl, setChartUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState("");

    // Fetch user profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const requestOptions = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`, // Include token for authentication
                    },
                };
                const response = await fetch(`http://localhost:8000/user/${username}`, requestOptions);

                if (!response.ok) {
                    throw new Error("Failed to fetch user profile.");
                }

                const data = await response.json();
                setUserProfile(data);
            } catch (error) {
                setError(error.message);
            }
        };

        if (token && username) {
            fetchUserProfile();
        }
    }, [token, username]); // Include token and username as dependencies

    // Fetch exercise info
    useEffect(() => {
        const fetchExerciseInfo = async () => {
            setLoading(true);
            setFetchError("");
            try {
                const response = await fetch("http://localhost:8000/user/logs/exercise-info", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch exercise info.");
                }

                const data = await response.json();
                setExercises(data);

                const firstExercise = Object.keys(data)[0];
                if (firstExercise) {
                    setExerciseName(firstExercise);
                    setAvailableAttributes(data[firstExercise]);
                    setAttribute(data[firstExercise][0]);
                }
            } catch (error) {
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchExerciseInfo();
        }
    }, [token]);

    const fetchExerciseLogs = async () => {
        if (!exerciseName || typeof exerciseName !== "string") {
            setFetchError("Please provide a valid exercise name.");
            return;
        }

        setLoading(true);
        setFetchError("");

        try {
            const response = await fetch(`http://localhost:8000/exercise/${exerciseName}/logs`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch exercise logs. Status: ${response.status}`);
            }

            const logs = await response.json();

            if (!logs || logs.length === 0) {
                setFetchError("No data found for the given exercise and user.");
                setLoading(false);
                return;
            }

            const labels = logs.map((log) => log.date);
            const values = logs.map((log) => log[attribute]);

            const chartData = {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: `${exerciseName} ${attribute}`,
                            data: values,
                            fill: false,
                            borderColor: "rgba(75, 192, 192, 1)",
                            tension: 0.1,
                        },
                    ],
                },
            };

            const quickChartResponse = await fetch("https://quickchart.io/chart/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ chart: chartData }),
            });

            if (!quickChartResponse.ok) {
                throw new Error("Failed to generate chart.");
            }

            const quickChartData = await quickChartResponse.json();
            setChartUrl(quickChartData.url);
        } catch (err) {
            setFetchError("Failed to fetch data. Please check your inputs and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchExerciseLogs();
    };

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!userProfile) {
        return <div className="loading">Loading...</div>;
    }


    return (
        <div className="app-container">
            <div className="profile-card">
                <h2 className="title is-2">My Profile</h2>
                <div className="profile-details">
                    <p className="text-gray-400" style={{fontSize: "20px"}}><strong>Name:</strong> {userProfile.name} {userProfile.surname}</p>
                    <p className="text-gray-400" style={{fontSize: "20px"}}><strong>Username:</strong> {userProfile.username}</p>
                    <p className="text-gray-400" style={{fontSize: "20px"}}><strong>Age:</strong> {userProfile.age}</p>
                    <p className="text-gray-400" style={{fontSize: "20px"}}><strong>Gender:</strong> {userProfile.gender}</p>
                    <p className="text-gray-400" style={{fontSize: "20px"}}><strong>Phone:</strong> {userProfile.phone}</p>
                    <p className="text-gray-400" style={{fontSize: "20px"}}><strong>Email:</strong> {userProfile.email}</p>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
