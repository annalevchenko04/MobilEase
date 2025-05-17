import React, { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";

const InitiativeCard = ({ initiative, onEdit, onDelete, onVote, hasVoted, activateInitiative, userId }) => {
  const [token, userRole] = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getMonthName = (monthNumber) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[monthNumber - 1];
  };

  const handleVote = async () => {
    setIsLoading(true);
    await onVote(initiative.id);
    setIsLoading(false);
  };

  const statusColors = {
    pending: "is-warning",
    active: "is-success",
    completed: "is-info",
    failed: "is-danger",
    archived: "is-light"
  };

  const canBeEdited = initiative.status === "pending" && !initiative.voting_end_date;
  const isSpecialVoting = !!initiative.voting_end_date;

  return (
    <div className="card mb-4" style={{
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: isSpecialVoting ? "0 0 0 2px #ffdd57" : undefined
    }}>
      <header className="card-header" style={{ backgroundColor: "#f8f9fa" }}>
        <p className="card-header-title">{initiative.title}</p>
        <div className="card-header-icon">
          <span className={`tag ${statusColors[initiative.status]}`}>
            {initiative.status.charAt(0).toUpperCase() + initiative.status.slice(1)}
          </span>
          {initiative.is_locked && (
            <span className="tag is-dark ml-2" title="This initiative is locked and cannot be changed">
              <i className="fas fa-lock mr-1"></i> Locked
            </span>
          )}
        </div>
      </header>

      <div className="card-content">
        <div className="content">
          <p>{initiative.description}</p>

          <div className="columns is-mobile">
            <div className="column">
              <p className="is-size-7">
                <strong>Month:</strong> {getMonthName(initiative.month)} {initiative.year}
              </p>
            </div>
            <div className="column">
              <p className="is-size-7">
                <strong>Created:</strong> {formatDate(initiative.created_at)}
              </p>
            </div>
          </div>

          {initiative.vote_count !== undefined && (
            <p>
              <strong>Votes:</strong> {initiative.vote_count}
            </p>
          )}

          {isSpecialVoting && (
            <div className="notification is-warning is-light p-2 mt-2 mb-0">
              <p className="is-size-7">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Special voting period ends {formatDate(initiative.voting_end_date)}
              </p>
            </div>
          )}

          {initiative.created_by === userId && (
            <div className="notification is-info is-light p-2 mt-2 mb-0">
              <p className="is-size-7"><i className="fas fa-info-circle mr-1"></i> You created this initiative</p>
            </div>
          )}
        </div>
      </div>

      <footer className="card-footer">
        {initiative.status === "pending" && (
          <>
            {!hasVoted ? (
              <a
                className="card-footer-item"
                onClick={handleVote}
                style={{ cursor: "pointer", backgroundColor: "#f0f8ff" }}
              >
                {isLoading ? "Voting..." : "Vote for this initiative"}
              </a>
            ) : (
              <a
                className="card-footer-item has-text-success"
                onClick={handleVote}
                style={{ cursor: "pointer", backgroundColor: "#f0fff4" }}
              >
                {isLoading ? "Removing..." : "Voted! Click to remove vote"}
              </a>
            )}
          </>
        )}

        {canBeEdited && initiative.created_by === userId && (
          <>
            {onEdit && (
              <a
                className="card-footer-item"
                onClick={() => onEdit(initiative)}
                style={{ cursor: "pointer" }}
              >
                Edit
              </a>
            )}
          </>
        )}

        {canBeEdited && (userRole === "admin" || initiative.created_by === userId) && (
          <>
            {onDelete && (
              <a
                className="card-footer-item has-text-danger"
                onClick={() => onDelete(initiative.id)}
                style={{ cursor: "pointer" }}
              >
                Delete
              </a>
            )}
          </>
        )}

        {userRole === "admin" && initiative.status === "pending" && !initiative.is_locked && (
          <a
            className="card-footer-item has-text-success"
            style={{ cursor: "pointer", fontWeight: "bold" }}
            onClick={() => {
              if (window.confirm(`Activate "${initiative.title}" as the company initiative?`)) {
                activateInitiative(initiative.id);
              }
            }}
          >
            Activate
          </a>
        )}
      </footer>
    </div>
  );
};

export default InitiativeCard;