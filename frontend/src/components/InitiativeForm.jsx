import React, { useState, useEffect } from "react";

const InitiativeForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(0);

  // Calculate next month on component load
  useEffect(() => {
    const currentDate = new Date();
    let nextMonth = currentDate.getMonth() + 2; // JavaScript months are 0-indexed, and we want next month
    let nextYear = currentDate.getFullYear();

    // If next month would be January (13), roll over to next year
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    setMonth(nextMonth);
    setYear(nextYear);
  }, []);

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

        <div className="field">
          <label className="label">Target Month</label>
          <div className="control">
            <div className="notification is-info is-light">
              <p>This initiative will be proposed for <strong>{getMonthName(month)} {year}</strong></p>
              <p className="is-size-7 mt-2">Initiatives are automatically scheduled for the upcoming month.</p>
            </div>
          </div>
        </div>

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