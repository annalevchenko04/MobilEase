import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";

const UserAvatar = ({ user_id }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarId, setAvatarId] = useState(null);
  const [token] = useContext(UserContext); // Get the token from context

  useEffect(() => {
    const fetchUserAvatar = async () => {
      try {
        const response = await fetch(`http://localhost:8000/users/${user_id}/avatar`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch avatar.");
        }

        const data = await response.json();
        const fullAvatarUrl = `http://localhost:8000${data.url}`;
        setAvatarUrl(fullAvatarUrl);
        setAvatarId(data.id);
      } catch (error) {
        console.error("Error fetching avatar:", error);
      }
    };

    if (user_id && token) {
      fetchUserAvatar();
    }
  }, [user_id, token]); // Re-run if user_id or token changes

  return (
    <div>
      {avatarUrl ? (
        <figure
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            overflow: "hidden",
            margin: "auto",
            border: "1px solid #00d1b2",
          }}
        >
          <img
            src={avatarUrl}
            alt="User Avatar"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </figure>
      ) : (
          <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                display: "flex",
                border: "1px solid #00d1b2",
                justifyContent: "center", // Centers horizontally
                alignItems: "center",     // Centers vertically
                backgroundColor: "#f0f0f0",
                color: "#888",
                margin: "auto",
                fontSize: "11px",          // Adjust font size to make it more readable
                textAlign: "center",       // Optional, helps with text alignment
              }}
          >
            No Avatar
          </div>

      )}
    </div>
  );
};

export default UserAvatar;
