import React, { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../context/UserContext";
import DailyCheckInTracker from "./DailyCheckInTracker";

const ProgressTracker = () => {
  const [token, userRole, username, userId] = useContext(UserContext);
  const [activeInitiative, setActiveInitiative] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressLoaded, setProgressLoaded] = useState(false); // Add this new state

  // Use useCallback to memoize the fetchUserProgress function
  const fetchUserProgress = useCallback(async (initiativeId, signal) => {
    try {
      console.log("Fetching user progress for initiative:", initiativeId);
      const response = await fetch(`http://localhost:8000/progress/?initiative_id=${initiativeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.status}`);
      }

      const data = await response.json();
      console.log("User progress data:", data);

      // If we have any progress data, the user has joined
      setHasJoined(data && data.length > 0);
      setLoading(false);
      setProgressLoaded(true); // Mark progress as loaded regardless of result
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error("Error fetching user progress:", error);
      setError("Error loading progress");
      setLoading(false);
      setProgressLoaded(true); // Still mark as loaded even on error
    }
  }, [token]);

  // Use useCallback to memoize the fetchActiveInitiative function
  const fetchActiveInitiative = useCallback(async (signal) => {
    try {
      console.log("Fetching active initiative...");
      const response = await fetch("http://localhost:8000/initiatives/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch initiatives: ${response.status}`);
      }

      const data = await response.json();
      console.log("All initiatives data:", data);

      // Find the active initiative from the list of all initiatives
      const active = data.find(i => i.status === "active");

      if (active) {
        console.log("Found active initiative:", active);
        setActiveInitiative(active);

        // Fetch progress if we have an active initiative
        if (active.id) {
          await fetchUserProgress(active.id, signal);
        } else {
          // If no active ID, still update loading states
          setLoading(false);
          setProgressLoaded(true);
        }
      } else {
        console.log("No active initiative found");
        setActiveInitiative(null);
        setLoading(false);
        setProgressLoaded(true); // Make sure we mark as loaded even if no initiative
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error("Error fetching active initiative:", error);
      setError("Error loading active initiative");
      setLoading(false);
      setProgressLoaded(true); // Make sure we mark as loaded even on error
    }
  }, [token, fetchUserProgress]);

  useEffect(() => {
    const controller = new AbortController();
    fetchActiveInitiative(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchActiveInitiative]);

  const joinInitiative = async () => {
    if (!activeInitiative || !activeInitiative.id) {
      setError("No active initiative to join");
      return;
    }

    try {
      console.log("Joining initiative:", activeInitiative.id);
      setLoading(true); // Set loading true while joining

      const response = await fetch("http://localhost:8000/progress/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          initiative_id: activeInitiative.id,
          progress: 0,
          completed: false,
          details: {
            checkedDays: []
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to join initiative: ${response.status}`);
      }

      setHasJoined(true);
      setLoading(false); // Set loading false after joining
      alert("You have successfully joined the initiative!");
    } catch (error) {
      console.error("Error joining initiative:", error);
      setError("Error joining initiative");
      setLoading(false); // Make sure loading is set to false on error
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <p>Loading active initiative...</p>
        <div style={{ marginTop: '10px', height: '4px', width: '100%', backgroundColor: '#f3f3f3', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: '30%', backgroundColor: '#3b82f6', borderRadius: '2px', animation: 'loading 1.5s infinite ease-in-out' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        padding: '10px 15px',
        borderRadius: '6px',
        margin: '10px 0'
      }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!activeInitiative) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ fontSize: '18px', color: '#4b5563', marginBottom: '8px' }}>No active initiative at the moment.</p>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Check back later or suggest a new initiative!</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ textAlign: 'center', padding: '20px 20px 0' }}>
        <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
          Current Initiative Progress
        </h3>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
            {activeInitiative.title}
          </h4>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Active Initiative</p>
          <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '16px' }}>
            {activeInitiative.description}
          </p>
        </div>

        {!hasJoined ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 0'
          }}>
            <div style={{
              backgroundColor: '#fffbeb',
              borderLeft: '4px solid #f59e0b',
              padding: '12px 16px',
              marginBottom: '24px',
              borderRadius: '4px',
              maxWidth: '500px',
              width: '100%'
            }}>
              <p style={{ margin: 0, color: '#92400e', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px', fontSize: '18px' }}>⚠️</span>
                You haven't joined this initiative yet. Join now to start tracking your progress!
              </p>
            </div>

            <button
              onClick={joinInitiative}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              <span>Start Initiative</span>
            </button>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
              Join this initiative to track your progress
            </p>
          </div>
        ) : progressLoaded ? (
          // Only render DailyCheckInTracker when progress is loaded
          <DailyCheckInTracker initiativeId={activeInitiative.id} />
        ) : (
          // Show a loading message while waiting for progress data
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading daily check-in tracker...</p>
            <div style={{ marginTop: '10px', height: '4px', width: '100%', backgroundColor: '#f3f3f3', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: '30%', backgroundColor: '#3b82f6', borderRadius: '2px', animation: 'loading 1.5s infinite ease-in-out' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;