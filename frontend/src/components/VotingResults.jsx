import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";

const VotingResults = ({ month, year }) => {
  const [token, userRole] = useContext(UserContext);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userRole !== "admin") {
      setError("Only admins can view voting results");
      setLoading(false);
      return;
    }

    fetchVotingResults();
  }, [month, year]);

  const fetchVotingResults = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/initiatives/voting-results/${month}/${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch voting results");
      }

      const data = await response.json();
      setResults(data);
      setLoading(false);
    } catch (error) {
      setError("Error loading voting results");
      setLoading(false);
    }
  };

  const activateInitiative = async (initiativeId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/initiatives/activate/${initiativeId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to activate initiative");
      }

      alert("Initiative activated successfully!");
      fetchVotingResults();
    } catch (error) {
      setError("Error activating initiative");
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[monthNumber - 1];
  };

  if (loading) {
    return (
      <div className="has-text-centered">
        <p>Loading voting results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification is-danger">
        <p>{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="notification is-info">
        <p>No initiatives found for {getMonthName(month)} {year}.</p>
      </div>
    );
  }

  return (
    <div className="box">
      <h3 className="title is-4">Voting Results - {getMonthName(month)} {year}</h3>

      <table className="table is-fullwidth is-striped">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Initiative</th>
            <th>Votes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map((initiative, index) => (
            <tr key={initiative.id} className={index === 0 ? "has-background-success-light" : ""}>
              <td>{index + 1}</td>
              <td>
                <p className="has-text-weight-bold">{initiative.title}</p>
                <p className="is-size-7">{initiative.description}</p>
              </td>
              <td>{initiative.vote_count}</td>
              <td>
                <button
                  className="button is-small is-success"
                  onClick={() => {
                    if (window.confirm(`Activate "${initiative.title}" as the company initiative?`)) {
                      activateInitiative(initiative.id);
                    }
                  }}
                >
                  Make Active
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {results.length > 0 && (
        <div className="notification is-success">
          <p className="has-text-weight-bold">
            The initiative with the most votes is "{results[0].title}" with {results[0].vote_count} votes.
          </p>
          <p>Click "Make Active" to set this as the current company initiative.</p>
        </div>
      )}
    </div>
  );
};

export default VotingResults;