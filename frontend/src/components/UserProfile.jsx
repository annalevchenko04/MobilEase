import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";

const UserProfile = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [error, setError] = useState(null);
    const [token, , username] = useContext(UserContext); // Get the token from context
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
