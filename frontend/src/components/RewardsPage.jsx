import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from "../context/UserContext";  // Assuming this context provides the token
import ErrorMessage from './ErrorMessage';
import { useNavigate } from 'react-router-dom';
import UserAvatar from "./UserAvatar";

const API_URL = 'https://esp548backend-ejbafshcc5a8eea3.northeurope-01.azurewebsites.net';
export default function RewardsPage() {
  const [reward, setReward] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [token, userRole, username, userId,] = useContext(UserContext);  // Getting the token from context
  const navigate = useNavigate();
  const [allRewards, setAllRewards] = useState([]);
  const [adminInfo, setAdminInfo] = useState(null);


  const fetchAllRewards = async () => {
  try {
    const res = await fetch(`${API_URL}/api/admin/rewards`, {
      method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,  // Sending the token for authorization
        },
    });
    const data = await res.json();
    setAllRewards(data);
  } catch (err) {
    console.error("Failed to fetch all rewards");
  }
};

useEffect(() => {
  const init = async () => {
    await fetchRewardData();
    if (userRole === "admin") {
      await fetchAllRewards();
    }
  };
  init();
}, [userRole]);

  const fetchRewardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/rewards/day-off`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,  // Sending the token for authorization
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reward data");
      }

      const data = await response.json();
      setReward(data);
    } catch (error) {
      setErrorMessage("Error fetching reward data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading your rewards...</p>;
  }

  if (errorMessage) {
    return <ErrorMessage message={errorMessage} />;
  }

  if (reward === null) {
    return <p>No reward found.</p>;
  }


const handleAdminRedeem = async (targetUserId) => {
  try {
    const res = await fetch(`${API_URL}/api/admin/rewards/redeem/${targetUserId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to redeem");
    await fetchAllRewards();
  } catch (error) {
    alert("Redeem failed.");
  }
};

const handleResetProgress = async (targetUserId) => {
  if (!window.confirm("Reset this user's reward and badges?")) return;
  try {
    const res = await fetch(`${API_URL}/api/admin/reset-progress/${targetUserId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to reset");
    await fetchAllRewards();
  } catch (error) {
    alert("Reset failed.");
  }
};


  // Handle reward data
  return (
      <div>
        <h2 className="title is-2">Rewards</h2>
        <br/>
        {reward.status === "issued" ? (
            <>
              <h5 className="title is-5">
                Congratulations! 🎉 You’ve unlocked 1 Day Off.
              </h5>
              <p className="text-gray-400" style={{fontSize: "20px"}}>Scan or share the QR code below with HR.</p>
              <br/>
              {reward.qr_code && (
                  <img
                      className="box" style={{
                    border: '3px solid #00d1b2',
                    maxHeight: '250px',
                    overflowY: 'auto',
                  }}
                      src={`data:image/png;base64,${reward.qr_code}`}  // QR code as base64 string
                      alt="QR Code for Day Off Reward"
                  />
              )}

              <a
                  href={`mailto:?subject= ESP a Day Off Reward&body=Hello! I just unlocked a reward day off! Verify my QR code `}
                  className="button is-link mt-4"
                  style={{backgroundColor: '#00d1b2', color: '#fff'}}
              >
                <i className="fas fa-paper-plane mr-2"></i>
              </a>

            </>
        ) : (
            <>
              <h5 className="title is-4">
                Earn 5 badges to unlock your Day Off Voucher!
              </h5>

              <div className="box" style={{
                border: '3px solid #00d1b2',
                maxHeight: '650px',
                overflowY: 'auto',
              }}>
                <ul className="goal-list">
                  {[
                    {icon: "📸", text: "Post 3 times", key: "post3", path: "/profile"},
                    {icon: "❤️", text: "Get 5 likes", key: "likes5", path: "/explore"},
                    {icon: "🌱", text: "Attend 3 sustainability events", key: "events3", path: "/schedule"},
                    {icon: "🏁", text: "Complete a challenge", key: "challenge1", path: "/initiatives"},
                    {icon: "🌍", text: "Reach the 2030 CO₂ goal", key: "co2goal", path: "/footprint"},
                  ].map((item) => (
                      <li
                          key={item.key}
                          className="interactive-goal"
                          onClick={() => navigate(item.path)}
                          style={{cursor: 'pointer'}}
                      >
                        <span className="icon">{item.icon}</span>
                        <span className="text-gray-400" style={{fontSize: "20px"}}>{item.text}</span>
                      </li>
                  ))}
                </ul>


              </div>

            </>
        )}

        {userRole === "admin" && (
  <div className="mt-6">
    <h3 className="title is-4">Admin Reward Overview</h3>
    <table className="table is-striped is-fullwidth">
      <thead>
      <tr>
        <th>Photo</th>
        <th>Role</th>
        <th>Name</th>
        <th>Surname</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Status</th>
        <th>QR Code</th>
        <th>Issued At</th>
        <th>Redeemed At</th>
        <th>Actions</th>
      </tr>
      </thead>

      <tbody>
      {allRewards.map((user) => (
          user.rewards.length > 0 ? (
              user.rewards.map((reward, index) => (
                  <tr key={reward.reward_id}>
                    {index === 0 && (
                        <>
                          <td rowSpan={user.rewards.length}>
                            <UserAvatar user_id={user.user_id}/>
                          </td>
                          <td rowSpan={user.rewards.length}>{user.role}</td>
                          <td rowSpan={user.rewards.length}>{user.name}</td>
                          <td rowSpan={user.rewards.length}>{user.surname}</td>
                          <td rowSpan={user.rewards.length}>{user.email}</td>
                          <td rowSpan={user.rewards.length}>{user.phone}</td>
                        </>
                    )}
                    <td>{reward.status}</td>
                    <td>
                      {reward.qr_code && (
                          <img
                              src={`data:image/png;base64,${reward.qr_code}`}
                              alt="QR"
                              style={{height: "60px"}}
                          />
                      )}
                    </td>
                    <td>{reward.issued_at ? new Date(reward.issued_at).toLocaleString() : "—"}</td>
                    <td>{reward.redeemed_at ? new Date(reward.redeemed_at).toLocaleString() : "—"}</td>


                    <td>
                      {reward.status === "issued" && (
                          <button
                              className="button is-small is-warning"
                              onClick={async () => {
                                await handleAdminRedeem(user.user_id);
                                await handleResetProgress(user.user_id);
                              }}
                          >
                            <i className="fas fa-sync-alt mr-1"></i> Redeem & Reset
                          </button>
                      )}
                    </td>
                  </tr>
              ))
          ) : (
              <tr key={`no-reward-${user.user_id}`}>
                <td><UserAvatar user_id={user.user_id}/></td>
                <td>{user.role}</td>
                <td>{user.name}</td>
                <td>{user.surname}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td colSpan={6}>No rewards</td>
              </tr>
          )
      ))}
      </tbody>

    </table>
  </div>
        )}


      </div>
  );
}
