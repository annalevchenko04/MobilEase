import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import ProgressTracker from "./ProgressTracker";
import InitiativeForm from "./InitiativeForm";
import InitiativeCard from "./InitiativeCard";
import VotingResults from "./VotingResults";
import CompanyProgressDashboard from "./CompanyProgressDashboard";
import { FaPlus, FaChartBar, FaVoteYea, FaClock } from "react-icons/fa";

const API_URL = 'https://esp548backend-ejbafshcc5a8eea3.northeurope-01.azurewebsites.net';
const Initiatives = () => {
  const [token, userRole, username, userId] = useContext(UserContext);
  const [initiatives, setInitiatives] = useState([]);
  const [pendingInitiatives, setPendingInitiatives] = useState([]);
  const [activeInitiative, setActiveInitiative] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInitiative, setEditInitiative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVotingResults, setShowVotingResults] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState(null);
  const [canSuggestInitiative, setCanSuggestInitiative] = useState(false);
  const [votingEndDate, setVotingEndDate] = useState(null);

  useEffect(() => {
    fetchInitiatives();
    checkCanSuggestInitiative();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const checkCanSuggestInitiative = async () => {
    try {
      console.log("Checking if user can suggest initiative...");
      const response = await fetch(`${API_URL}/initiatives/can-suggest`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 422) {
        console.warn("API validation error, defaulting to allowing suggestion");
        setCanSuggestInitiative(true);
        return;
      }

      if (!response.ok) {
        console.warn(`Failed to check initiative suggestion status: ${response.status}`);
        setCanSuggestInitiative(true); // Default to true on error
        return;
      }

      try {
        const data = await response.json();
        console.log("Can suggest initiative response:", data);
        setCanSuggestInitiative(data.can_suggest !== false); // Only set false if explicitly false
      } catch (parseError) {
        console.warn("Error parsing JSON response:", parseError);
        setCanSuggestInitiative(true); // Default to true if parsing fails
      }
    } catch (error) {
      console.error("Error checking if user can suggest initiative:", error);
      setCanSuggestInitiative(true); // Default to true on any error
    }
  };

  const fetchInitiatives = async () => {
    try {
      console.log("Fetching initiatives...");
      // Fetch all initiatives for the user's company
      const response = await fetch(`${API_URL}/initiatives/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch initiatives");
      }

      const data = await response.json();
      console.log("Fetched initiatives:", data);
      setInitiatives(data);

      // Separate initiatives by status
      const pending = data.filter(i => i.status === "pending");
      const active = data.find(i => i.status === "active");
      const failed = data.filter(i => i.status === "failed");

      // Check if there's a voting end date
      const currentVoting = pending.find(i => i.voting_end_date);
      if (currentVoting) {
        setVotingEndDate(new Date(currentVoting.voting_end_date));
      } else {
        setVotingEndDate(null);
      }

      setPendingInitiatives(pending);
      setActiveInitiative(active || null);

      // Get user's votes only for pending initiatives
      const votes = {};
      for (const initiative of pending) {
        const voteResponse = await fetch(`${API_URL}/initiatives/${initiative.id}/votes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (voteResponse.ok) {
          const voteData = await voteResponse.json();
          votes[initiative.id] = voteData.some(v => v.user_id === userId);
        }
      }
      setUserVotes(votes);

      setLoading(false);
    } catch (error) {
      console.error("Error in fetchInitiatives:", error);
      setError("Error loading initiatives");
      setLoading(false);
    }
  };

  const handleCreateInitiative = async (initiativeData) => {
    try {
      const response = await fetch(`${API_URL}/initiatives/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(initiativeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create initiative");
      }

      setIsFormOpen(false);
      await fetchInitiatives();
      await checkCanSuggestInitiative();
    } catch (error) {
      setError(error.message || "Error creating initiative");
    }
  };

  const handleUpdateInitiative = async (initiativeData) => {
    try {
      const response = await fetch(`${API_URL}/initiatives/${editInitiative.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(initiativeData),
      });

      if (!response.ok) {
        throw new Error("Failed to update initiative");
      }

      setIsFormOpen(false);
      setIsEditMode(false);
      setEditInitiative(null);
      fetchInitiatives();
    } catch (error) {
      setError("Error updating initiative");
    }
  };

  const handleEditInitiative = (initiative) => {
    setEditInitiative(initiative);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleDeleteInitiative = async (initiativeId) => {
    if (!window.confirm("Are you sure you want to delete this initiative?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/initiatives/${initiativeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete initiative");
      }

      await fetchInitiatives();
      await checkCanSuggestInitiative(); // Re-check if user can now suggest
    } catch (error) {
      setError("Error deleting initiative");
    }
  };

  const handleVote = async (initiativeId) => {
    const hasVoted = userVotes[initiativeId];

    try {
      const response = await fetch(`${API_URL}/initiatives/${initiativeId}/vote`, {
        method: hasVoted ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${hasVoted ? "remove vote" : "vote"}`);
      }

      // Update the local vote state
      setUserVotes({
        ...userVotes,
        [initiativeId]: !hasVoted,
      });

      // Refresh initiatives to update vote counts
      fetchInitiatives();
    } catch (error) {
      setError(`Error ${hasVoted ? "removing vote" : "voting"}`);
    }
  };

  const activateInitiative = async (initiativeId) => {
    try {
      const response = await fetch(`${API_URL}/initiatives/activate/${initiativeId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to activate initiative");
      }

      alert("Initiative activated successfully!");
      fetchInitiatives();
    } catch (error) {
      setError("Error activating initiative");
    }
  };

  const deactivateInitiative = async (initiativeId) => {
    if (!window.confirm("Are you sure you want to deactivate this initiative? This will start a new 3-day voting period.")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/initiatives/${initiativeId}/deactivate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to deactivate initiative");
      }

      const data = await response.json();
      alert(data.message);
      setVotingEndDate(new Date(data.voting_end_date));
      fetchInitiatives();
    } catch (error) {
      setError(error.message || "Error deactivating initiative");
    }
  };

  const runScheduledTasks = async () => {
    if (!window.confirm("Are you sure you want to run scheduled tasks? This will process any pending actions in the system.")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/run-scheduled-tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to run scheduled tasks");
      }

      const data = await response.json();
      alert(`Scheduled tasks completed. ${data.deleted_initiatives} failed initiatives were deleted.`);
      fetchInitiatives();
      checkCanSuggestInitiative();
    } catch (error) {
      setError("Error running scheduled tasks");
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setEditInitiative(null);
  };

  const timeUntilVotingEnds = () => {
    if (!votingEndDate) return null;

    const now = new Date();
    const diff = votingEndDate.getTime() - now.getTime();

    if (diff <= 0) return "Voting has ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div>
      <h2 className="title is-2">Sustainability Initiatives</h2>

      {error && (
        <div className="notification is-danger">
          <button className="delete" onClick={() => setError("")}></button>
          {error}
        </div>
      )}

      {/* Active Initiative Progress Tracker */}
      {!loading && activeInitiative &&
  <ProgressTracker key={activeInitiative.id} initiativeId={activeInitiative.id} />}

      {/* Voting Period Notification */}
      {votingEndDate && (
        <div className="notification is-warning">
          <p className="has-text-weight-bold">
            <FaClock className="mr-2" /> Special voting period in progress!
          </p>
          <p>Vote for the next initiative to implement. Voting ends: {formatDate(votingEndDate)} ({timeUntilVotingEnds()})</p>
        </div>
      )}

      {/* Admin Controls */}
      {userRole === "admin" && (
        <div className="box has-background-light">
          <h3 className="title is-4">Admin Controls</h3>
          <div className="buttons">
            <button
              className={`button ${showVotingResults ? 'is-info' : 'is-outlined is-info'}`}
              onClick={() => setShowVotingResults(!showVotingResults)}
            >
              <span className="icon">
                <FaChartBar />
              </span>
              <span>{showVotingResults ? 'Hide Voting Results' : 'Show Voting Results'}</span>
            </button>

            <button
              className={`button ${showProgressDashboard ? 'is-success' : 'is-outlined is-success'}`}
              onClick={() => {
                setShowProgressDashboard(!showProgressDashboard);
                if (activeInitiative && !showProgressDashboard) {
                  setSelectedInitiativeId(activeInitiative.id);
                }
              }}
            >
              <span className="icon">
                <i className="fas fa-chart-line"></i>
              </span>
              <span>{showProgressDashboard ? 'Hide Progress Dashboard' : 'Show Progress Dashboard'}</span>
            </button>

            <button
              className="button is-warning"
              onClick={runScheduledTasks}
            >
              <span className="icon">
                <i className="fas fa-tasks"></i>
              </span>
              <span>Run Scheduled Tasks</span>
            </button>

            {activeInitiative && !activeInitiative.is_locked && (
              <button
                className="button is-danger is-outlined"
                onClick={() => deactivateInitiative(activeInitiative.id)}
              >
                <span className="icon">
                  <i className="fas fa-stop-circle"></i>
                </span>
                <span>Deactivate Current Initiative</span>
              </button>
            )}
          </div>

          {showVotingResults && (
            <div className="mt-4">
              <div className="field is-grouped">
                <div className="control">
                  <div className="select">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="control">
                  <div className="select">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    >
                      {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <VotingResults month={selectedMonth} year={selectedYear} />
            </div>
          )}

          {showProgressDashboard && activeInitiative && (
            <div className="mt-4">
              <div className="field my-3">
                <label className="label">Select Initiative to View</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      value={selectedInitiativeId || activeInitiative.id}
                      onChange={(e) => setSelectedInitiativeId(parseInt(e.target.value, 10))}
                    >
                      <option value={activeInitiative.id}>
                        Active: {activeInitiative.title}
                      </option>
                      {initiatives
                        .filter(i => i.status === "completed")
                        // Use the initiative ID to make sure we only show each initiative once
                        .filter((item, index, self) => self.findIndex(i => i.id === item.id) === index)
                        .map(i => (
                          <option key={i.id} value={i.id}>
                            Completed: {i.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
              <CompanyProgressDashboard initiativeId={selectedInitiativeId || activeInitiative.id} />
            </div>
          )}
        </div>
      )}

      {/* Initiative Submission Form Toggle */}
      <div className="has-text-centered my-5">
        {/* Only show the Suggest button if user can suggest and form isn't open */}
        {!isFormOpen && canSuggestInitiative ? (
          <button
            className="button is-primary is-rounded"
            onClick={() => setIsFormOpen(true)}
          >
            <span className="icon">
              <FaPlus />
            </span>
            <span>Suggest New Initiative</span>
          </button>
        ) : !isFormOpen && !canSuggestInitiative ? (
          <div className="notification is-info is-light">
            <p>You've already suggested an initiative for the upcoming month.</p>
          </div>
        ) : (
          <div className="box">
            <InitiativeForm
              onSubmit={isEditMode ? handleUpdateInitiative : handleCreateInitiative}
              onCancel={closeForm}
            />
          </div>
        )}
      </div>

      {/* Pending Initiatives for Voting */}
      {pendingInitiatives.length > 0 && (
        <div className="section">
          <h3 className="title is-4">
            <span className="icon-text">
              <span className="icon">
                <FaVoteYea />
              </span>
              <span>Vote for Upcoming Initiatives</span>
            </span>
          </h3>

          <div className="columns is-multiline">
            {pendingInitiatives.map((initiative) => (
              <div className="column is-one-third" key={initiative.id}>
                <InitiativeCard
                  initiative={initiative}
                  onEdit={userRole === "admin" ? handleEditInitiative : null}
                  onDelete={userRole === "admin" || initiative.created_by === userId ? handleDeleteInitiative : null}
                  onVote={handleVote}
                  hasVoted={userVotes[initiative.id]}
                  activateInitiative={activateInitiative}
                  userId={userId}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Initiatives */}
      {initiatives.filter(i => i.status === "failed").length > 0 && (
        <div className="section">
          <h3 className="title is-4">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-times-circle"></i>
              </span>
              <span>Failed Initiatives</span>
            </span>
          </h3>

          <div className="columns is-multiline">
            {initiatives.filter(i => i.status === "failed").map((initiative) => (
              <div className="column is-one-third" key={initiative.id}>
                <div className="card">
                  <div className="card-content">
                    <p className="title is-5">{initiative.title}</p>
                    <p className="subtitle is-6">{initiative.description}</p>
                    <p className="has-text-grey">
                      This initiative did not receive enough votes.
                      {initiative.auto_delete_date && (
                        <span> It will be removed on {formatDate(initiative.auto_delete_date)}.</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="has-text-centered mt-6">
          <p>Loading initiatives...</p>
        </div>
      )}

      {!loading && pendingInitiatives.length === 0 && !activeInitiative && initiatives.filter(i => i.status === "failed").length === 0 && (
        <div className="notification is-info has-text-centered mt-6">
          <p>No initiatives found. Be the first to suggest one!</p>
        </div>
      )}
    </div>
  );
};

export default Initiatives;