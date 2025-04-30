import React, { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../context/UserContext";

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
  const fetchUserProgress = useCallback(async () => {
    if (!initiativeId) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/progress/?initiative_id=${initiativeId}`, {
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
          // Parse details if it's a string, or use directly if it's already an object
          const details = typeof progress.details === 'string'
            ? JSON.parse(progress.details)
            : progress.details;

          setCheckedDays(details?.checkedDays || []);
          setCompleted(progress.completed || false);

          // Calculate percentage based on checked days vs. total days in month
          const percentage = Math.floor((details?.checkedDays?.length || 0) / daysInMonth * 100);
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
  }, [initiativeId, token, daysInMonth]);

  useEffect(() => {
    if (initiativeId) {
      fetchUserProgress();
    }
  }, [initiativeId, fetchUserProgress]);

  // Toggle check-in for a day
  const toggleDayCheck = async (day) => {
    // Only allow checking/unchecking checkable days
    if (!day.isCheckable) {
      alert("You can only check in for today and the previous 2 days.");
      return;
    }

    try {
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
      const isCompleted = newPercentage === 100;

      // Update the state immediately for better UX
      setCheckedDays(newCheckedDays);
      setProgressPercentage(newPercentage);

      // Save to the server
      const response = await fetch("http://localhost:8000/progress/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          initiative_id: initiativeId,
          progress: newPercentage,
          completed: isCompleted,
          details: {
            checkedDays: newCheckedDays
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update check-in");
      }

      // If now complete, update the completed state
      if (isCompleted && !completed) {
        setCompleted(true);
        alert("Congratulations! You've completed this initiative and earned a badge!");
      } else {
        setCompleted(isCompleted);
      }

      console.log("Check-in updated successfully");
    } catch (error) {
      console.error("Error updating check-in:", error);
      setError("Failed to update check-in");
      // Revert the state change on error
      fetchUserProgress();
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
                      Apr {day.day}
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