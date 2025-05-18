import React, { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../context/UserContext";

const API_URL = 'https://esp548backend-ejbafshcc5a8eea3.northeurope-01.azurewebsites.net';

const DailyCheckInTracker = ({ initiativeId }) => {
  const [token, userRole, username, userId] = useContext(UserContext);
  const [flatDays, setFlatDays] = useState([]);
  const [checkedDays, setCheckedDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [currentMonth, setCurrentMonth] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [checkableStartDate, setCheckableStartDate] = useState(null);
  const [checkableEndDate, setCheckableEndDate] = useState(null);
  const [saveInProgress, setSaveInProgress] = useState(false); // New state for save button
  const [successMessage, setSuccessMessage] = useState(""); // New state for success message

  // Generate array of days for the current month
  useEffect(() => {
    const generateDays = () => {
      const currentDate = new Date();
      const currYear = currentDate.getFullYear();
      const currentMonthIndex = currentDate.getMonth();
      const daysInCurrentMonth = new Date(currYear, currentMonthIndex + 1, 0).getDate();
      const firstDayOfMonth = new Date(currYear, currentMonthIndex, 1).getDay();

      // Set the month name and year
      setCurrentMonth(new Date(currYear, currentMonthIndex).toLocaleString('default', { month: 'long' }));
      setCurrentYear(currYear);
      setDaysInMonth(daysInCurrentMonth);

      // Create array of day objects
      const days = [];

      // Add empty placeholders for days before the 1st of the month
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push({
          day: null,
          date: null,
          isEmpty: true
        });
      }

      // Add actual days of month
      for (let i = 1; i <= daysInCurrentMonth; i++) {
        const date = new Date(currYear, currentMonthIndex, i);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);

        const dateWithoutTime = new Date(date);
        dateWithoutTime.setHours(0, 0, 0, 0);

        const isCheckable = dateWithoutTime >= twoDaysAgo && dateWithoutTime <= today;

        if (i === 1 || dateWithoutTime.getTime() === twoDaysAgo.getTime()) {
          setCheckableStartDate(twoDaysAgo);
        }
        if (i === daysInCurrentMonth || dateWithoutTime.getTime() === today.getTime()) {
          setCheckableEndDate(today);
        }

        days.push({
          day: i,
          date: date,
          isToday: dateWithoutTime.getTime() === today.getTime(),
          isCheckable: isCheckable,
          isEmpty: false
        });
      }

      setFlatDays(days);
    };

    generateDays();
  }, []);

  // Fetch the user's progress for this initiative
  const fetchUserProgress = useCallback(async (initiativeId) => {
  if (!initiativeId) return;

  try {
    setLoading(true);
    const response = await fetch(`${API_URL}/progress/?initiative_id=${initiativeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.status}`);
    }

    const data = await response.json();
    console.log("User progress data:", data);

    if (data && data.length > 0) {
      // Get the checked days from the details field
      const progress = data[0];

      try {
        // Parse details if it's a string
        let details;

        if (typeof progress.details === 'string') {
          details = JSON.parse(progress.details);
          // Handle potential double encoding
          if (typeof details === 'string') {
            details = JSON.parse(details);
          }
        } else {
          details = progress.details;
        }

        console.log("Parsed details:", details);

        // Ensure checkedDays is an array
        const daysList = details?.checkedDays || [];
        console.log("Days list:", daysList);

        // Convert to numbers if they're strings
        const checkedDaysNumbers = daysList.map(d =>
          typeof d === 'string' ? parseInt(d, 10) : d
        );

        console.log("Final checked days:", checkedDaysNumbers);
        setCheckedDays(checkedDaysNumbers);
        setCompleted(progress.completed || false);

        // Calculate percentage based on checked days vs. total days in month
        const percentage = Math.floor(checkedDaysNumbers.length / daysInMonth * 100);
        setProgressPercentage(percentage);
      } catch (e) {
        console.error("Error parsing progress details:", e);
        setCheckedDays([]);
      }
    } else {
      setCheckedDays([]);
      setCompleted(false);
      setProgressPercentage(0);
    }
    setLoading(false);
  } catch (error) {
    console.error("Error fetching user progress:", error);
    setError("Error loading progress");
    setLoading(false);
  }
}, [token, daysInMonth]);

  useEffect(() => {
    if (initiativeId) {
      fetchUserProgress(initiativeId);
    }
  }, [initiativeId, fetchUserProgress]);

  // Toggle check-in for a day
  const toggleDayCheck = (day) => {
    // Only allow checking/unchecking checkable days
    if (!day.isCheckable) {
      alert("You can only check in for today and the previous 2 days.");
      return;
    }

    // Clear any previous messages
    setError("");
    setSuccessMessage("");

    // Create a new array of checked days
    let newCheckedDays;

    if (checkedDays.includes(day.day)) {
      // If already checked, uncheck it
      newCheckedDays = checkedDays.filter(d => d !== day.day);
    } else {
      // If not checked, check it
      newCheckedDays = [...checkedDays, day.day];
    }

    // Calculate new progress percentage
    const newPercentage = Math.floor(newCheckedDays.length / daysInMonth * 100);

    // Update the state immediately for better UX
    setCheckedDays(newCheckedDays);
    setProgressPercentage(newPercentage);
  };

  // New function to save progress to server
  const saveProgress = async () => {
  if (!initiativeId) {
    setError("No active initiative found");
    return;
  }

  try {
    setSaveInProgress(true);

    // Calculate progress percentage
    const newPercentage = Math.floor(checkedDays.length / daysInMonth * 100);
    const isCompleted = newPercentage === 100;

    console.log("Saving progress for initiative:", initiativeId);
    console.log("Checked days to save:", checkedDays);

    const response = await fetch(`${API_URL}/progress/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        initiative_id: parseInt(initiativeId, 10),
        progress: newPercentage,
        completed: isCompleted,
        details: {
          checkedDays: checkedDays
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error response:", errorText);
      throw new Error(`Failed to save progress: ${response.status}`);
    }

    // Log successful save
    const responseData = await response.json();
    console.log("Progress saved successfully", responseData);

    // Set success message
    setSuccessMessage("Progress saved successfully!");

    // If now complete, update the completed state
    if (isCompleted && !completed) {
      setCompleted(true);
      alert("Congratulations! You've completed this initiative and earned a badge!");
    } else {
      setCompleted(isCompleted);
    }

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(""), 3000);

    // Fetch the updated progress to ensure state is in sync with backend
    await fetchUserProgress(initiativeId);

  } catch (error) {
    console.error("Error saving progress:", error);
    setError("Failed to save progress: " + error.message);
  } finally {
    setSaveInProgress(false);
  }
};

  // Format date as "Month Day"
  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };




  // Format checkable date range for display
  const formatCheckableDateRange = () => {
    if (!checkableStartDate || !checkableEndDate) return "";

    return `${formatDate(checkableStartDate)} and ${formatDate(checkableEndDate)}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p>Loading daily check-in tracker...</p>
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

  return (
    <div style={{
      fontFamily: "'Arial', sans-serif",
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#333', margin: '0 0 4px 0' }}>
          Daily Check-in Tracker
        </h3>
        <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>
          Track your daily participation in this initiative
        </p>
      </div>


      {/* Success or Error Messages */}
      {successMessage && (
        <div style={{
          margin: '0 20px 20px',
          backgroundColor: '#ecfdf5',
          padding: '12px 16px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ color: '#10b981', marginRight: '8px' }}>✓</span>
          <span style={{ color: '#065f46', fontSize: '14px' }}>{successMessage}</span>
        </div>
      )}

      {error && (
        <div style={{
          margin: '0 20px 20px',
          backgroundColor: '#fee2e2',
          padding: '12px 16px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ color: '#ef4444', marginRight: '8px' }}>!</span>
          <span style={{ color: '#b91c1c', fontSize: '14px' }}>{error}</span>
        </div>
      )}

      {/* Progress Circle */}
      <div style={{
        position: 'relative',
        width: '100px',
        height: '100px',
        margin: '0 auto 20px'
      }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#34d399"
            strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 45 * progressPercentage / 100} ${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
            strokeDashoffset={2 * Math.PI * 45 * 0.25}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          {progressPercentage}%
        </div>
      </div>

      {/* Info notification */}
      <div style={{
        margin: '0 20px 20px',
        backgroundColor: '#f0f9ff',
        padding: '12px 16px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <span style={{ color: '#3b82f6', marginRight: '8px' }}>ⓘ</span>
        <span style={{ color: '#1e40af', fontSize: '14px' }}>
          You can only check in for dates between {formatCheckableDateRange()}.
        </span>
      </div>

      {/* Calendar */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ textAlign: 'center', margin: '0 0 20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px'
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                padding: '8px 0'
              }}>
                {day}
              </div>
            ))}

            {flatDays.map((day, i) => (
              <div
                key={i}
                onClick={() => !day.isEmpty ? toggleDayCheck(day) : null}
                style={{
                  minHeight: '64px',
                  backgroundColor: day.isEmpty ? 'transparent' :
                                  checkedDays.includes(day.day) ? '#d1fae5' :
                                  day.isCheckable ? '#eef7ff' : '#f5f5f5',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 0',
                  cursor: day.isEmpty ? 'default' : day.isCheckable ? 'pointer' : 'not-allowed',
                  opacity: day.isEmpty ? 0 : 1,
                  position: 'relative',
                  border: day.isCheckable && !checkedDays.includes(day.day) ? '1px solid #e5e7eb' : 'none'
                }}
              >
                {!day.isEmpty && (
                  <>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: day.isToday ? '#3b82f6' : '#333'
                    }}>
                      {day.day}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '2px'
                    }}>
                      {day.date && day.date.toLocaleString('default', { month: 'short' })} {day.day}
                    </div>

                    {/* Check mark for checked days */}
                    {checkedDays.includes(day.day) && (
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        fontSize: '10px'
                      }}>
                        ✓
                      </div>
                    )}

                    {/* Empty circle for checkable days */}
                    {day.isCheckable && !checkedDays.includes(day.day) && (
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '1px solid #93c5fd',
                        backgroundColor: 'white'
                      }}></div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Click on a day to mark your participation. You can only check in for today and the previous 2 days.
          </p>
        </div>

        {/* Add the Save Progress button */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={saveProgress}
            disabled={saveInProgress}
            style={{
              backgroundColor: saveInProgress ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: saveInProgress ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {saveInProgress ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save Progress</span>
              </>
            )}
          </button>
        </div>
        {/* Progress footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '10px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Progress: {checkedDays.length}/{daysInMonth} days checked
          </div>
          <div style={{
            backgroundColor: completed ? '#ecfdf5' : '#eff6ff',
            color: completed ? '#065f46' : '#1e40af',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {completed ? 'Completed' : 'In Progress'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyCheckInTracker;