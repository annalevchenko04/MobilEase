import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext"; // Import UserContext

const InitiativeForm = ({ onSubmit, onCancel }) => {
  const [token, userRole] = useContext(UserContext); // Get userRole from context
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [nextMonth, setNextMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(0);
  const [nextYear, setNextYear] = useState(0);

  // Calculate current and next month on component load
  useEffect(() => {
    const currentDate = new Date();

    // Current month (1-12)
    let currMonth = currentDate.getMonth() + 1;
    let currYear = currentDate.getFullYear();

    // Next month calculation
    let nxtMonth = currMonth + 1;
    let nxtYear = currYear;

    // If next month would be January (13), roll over to next year
    if (nxtMonth > 12) {
      nxtMonth = 1;
      nxtYear += 1;
    }

    setCurrentMonth(currMonth);
    setCurrentYear(currYear);
    setNextMonth(nxtMonth);
    setNextYear(nxtYear);

    // For non-admins, always set to next month
    // For admins, default to current month
    if (userRole === "admin") {
      setMonth(currMonth);
      setYear(currYear);
    } else {
      setMonth(nxtMonth);
      setYear(nxtYear);
    }
  }, [userRole]);

  const getMonthName = (monthNumber) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[monthNumber - 1] || "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !description) {
      alert("Please fill in all fields");
      return;
    }

    onSubmit({
      title,
      description,
      month,
      year,
    });
  };

  return (
    <div>
      <h3 className="title is-4">Suggest a Sustainability Initiative</h3>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Title</label>
          <div className="control">
            <input
              className="input"
              type="text"
              placeholder="Enter initiative title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Description</label>
          <div className="control">
            <textarea
              className="textarea"
              placeholder="Describe the initiative and how it can be implemented"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
        </div>

        {/* Display month selector for admins */}
        {userRole === "admin" ? (
          <div className="field">
            <label className="label">Target Month</label>
            <div className="control">
              <div className="select">
                <select
                  value={`${month}-${year}`}
                  onChange={(e) => {
                    const [m, y] = e.target.value.split('-').map(Number);
                    setMonth(m);
                    setYear(y);
                  }}
                >
                  <option value={`${currentMonth}-${currentYear}`}>
                    Current Month ({getMonthName(currentMonth)} {currentYear})
                  </option>
                  <option value={`${nextMonth}-${nextYear}`}>
                    Next Month ({getMonthName(nextMonth)} {nextYear})
                  </option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="field">
            <label className="label">Target Month</label>
            <div className="control">
              <div className="notification is-info is-light">
                <p>This initiative will be proposed for <strong>{getMonthName(month)} {year}</strong></p>
                <p className="is-size-7 mt-2">Initiatives are automatically scheduled for the upcoming month.</p>
              </div>
            </div>
          </div>
        )}

        <div className="field is-grouped is-grouped-right">
          <div className="control">
            <button type="button" className="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
          <div className="control">
            <button type="submit" className="button is-primary">
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InitiativeForm;