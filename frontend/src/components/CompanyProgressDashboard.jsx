import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CompanyProgressDashboard = ({ initiativeId }) => {
  const [token, userRole] = useContext(UserContext);
  const [progressData, setProgressData] = useState([]);
  const [initiative, setInitiative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completionRate, setCompletionRate] = useState(0);
  const [averageProgress, setAverageProgress] = useState(0);
  const [averageDaysCompleted, setAverageDaysCompleted] = useState(0);
  const [daysInMonth, setDaysInMonth] = useState(30); // Default to 30 days

  useEffect(() => {
    if (userRole !== "admin") {
      setError("Only admins can view company progress");
      setLoading(false);
      return;
    }

    if (initiativeId) {
      setLoading(true);
      setError("");
      fetchInitiativeData();
    }
  }, [initiativeId, userRole]);

  useEffect(() => {
    // Calculate days in current month
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    const daysCount = new Date(year, month + 1, 0).getDate();
    setDaysInMonth(daysCount);
  }, []);

  const fetchInitiativeData = async () => {
    try {
      console.log("Fetching initiative data for ID:", initiativeId);
      const response = await fetch(`http://localhost:8000/initiatives/${initiativeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch initiative details (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log("Initiative data received:", data);
      setInitiative(data);

      // Now fetch the progress data
      await fetchCompanyProgress();
    } catch (error) {
      console.error("Error in fetchInitiativeData:", error);
      setError(`Error loading initiative details: ${error.message}`);
      setLoading(false);
    }
  };

  const fetchCompanyProgress = async () => {
    try {
      if (!initiativeId) {
        throw new Error("No initiative ID provided");
      }

      console.log("Fetching company progress for initiative ID:", initiativeId);
      const response = await fetch(`http://localhost:8000/initiatives/${initiativeId}/progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch company progress (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log("Progress data received:", data);

      // Process the data to extract day-based progress
      const processedData = data.map(entry => {
        let checkedDays = [];

        // Try to parse details to get checked days
        try {
          const details = typeof entry.details === 'string'
            ? JSON.parse(entry.details)
            : entry.details;

          checkedDays = details?.checkedDays || [];
        } catch (e) {
          console.error("Error parsing progress details:", e);
        }

        return {
          ...entry,
          daysCompleted: checkedDays.length,
          checkedDays
        };
      });

      setProgressData(processedData);

      // Calculate completion rate and average progress
      if (processedData.length > 0) {
        const completedCount = processedData.filter(p => p.completed).length;
        const completionRate = (completedCount / processedData.length) * 100;
        setCompletionRate(completionRate);

        // Calculate in percentage (for backwards compatibility)
        const totalProgress = processedData.reduce((sum, p) => sum + p.progress, 0);
        const avgProgress = totalProgress / processedData.length;
        setAverageProgress(avgProgress);

        // Calculate average days completed
        const totalDaysCompleted = processedData.reduce((sum, p) => sum + p.daysCompleted, 0);
        const avgDaysCompleted = totalDaysCompleted / processedData.length;
        setAverageDaysCompleted(avgDaysCompleted);
      } else {
        setCompletionRate(0);
        setAverageProgress(0);
        setAverageDaysCompleted(0);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error in fetchCompanyProgress:", error);
      setError(`Error loading company progress: ${error.message}`);
      setLoading(false);
    }
  };

  const prepareCompletionData = () => {
    const completed = progressData.filter(p => p.completed).length;
    const inProgress = progressData.filter(p => !p.completed && p.daysCompleted > 0).length;
    const notStarted = progressData.filter(p => p.daysCompleted === 0).length;

    return [
      { name: "Completed", value: completed },
      { name: "In Progress", value: inProgress },
      { name: "Not Started", value: notStarted },
    ];
  };

  const prepareDayRanges = () => {
    const ranges = [
      { name: "0 days", count: 0 },
      { name: "1-5 days", count: 0 },
      { name: "6-10 days", count: 0 },
      { name: "11-15 days", count: 0 },
      { name: "16-20 days", count: 0 },
      { name: "21+ days", count: 0 },
    ];

    progressData.forEach(p => {
      const days = p.daysCompleted;
      if (days === 0) ranges[0].count++;
      else if (days <= 5) ranges[1].count++;
      else if (days <= 10) ranges[2].count++;
      else if (days <= 15) ranges[3].count++;
      else if (days <= 20) ranges[4].count++;
      else ranges[5].count++;
    });

    return ranges;
  };

  const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#8884D8", "#82CA9D"];

  if (loading) {
    return (
      <div className="box has-text-centered">
        <p>Loading company progress dashboard...</p>
        <progress className="progress is-small is-primary" max="100"></progress>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification is-danger">
        <button className="delete" onClick={() => setError("")}></button>
        <p><strong>Error:</strong> {error}</p>
        <p className="is-size-7 mt-2">Please refresh the page or try again later.</p>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="notification is-info">
        <p>No initiative data available. Please select a valid initiative.</p>
      </div>
    );
  }

  return (
    <div className="box">
      <h3 className="title is-4">Company Progress Dashboard</h3>
      <h4 className="subtitle is-5">{initiative.title}</h4>

      <div className="columns">
        <div className="column">
          <div className="box has-text-centered">
            <p className="heading">Completion Rate</p>
            <p className="title">{completionRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="column">
          <div className="box has-text-centered">
            <p className="heading">Avg. Days Completed</p>
            <p className="title">{averageDaysCompleted.toFixed(1)}/{daysInMonth}</p>
            <p className="is-size-7">({(averageDaysCompleted/daysInMonth*100).toFixed(1)}%)</p>
          </div>
        </div>
        <div className="column">
          <div className="box has-text-centered">
            <p className="heading">Participants</p>
            <p className="title">{progressData.length}</p>
          </div>
        </div>
      </div>

      {progressData.length > 0 ? (
        <>
          <div className="columns">
            <div className="column is-half">
              <h5 className="title is-5">Completion Status</h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={prepareCompletionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {prepareCompletionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="column is-half">
              <h5 className="title is-5">Days Completed Distribution</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={prepareDayRanges()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Employees" fill="#00d1b2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h5 className="title is-5 mt-5">Individual Progress</h5>
          <div className="table-container" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Days Completed</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {progressData.map((progress) => (
                  <tr key={progress.id}>
                    <td>{progress.user_id}</td>
                    <td>
                      <span className="tag is-primary">
                        {progress.daysCompleted} / {daysInMonth} days
                      </span>
                    </td>
                    <td>
                      <progress
                        className={`progress ${progress.completed ? "is-success" : "is-info"}`}
                        value={progress.progress}
                        max="100"
                      >
                        {progress.progress}%
                      </progress>
                    </td>
                    <td>
                      <span className={`tag ${progress.completed ? "is-success" : "is-info"}`}>
                        {progress.completed ? "Completed" : "In Progress"}
                      </span>
                    </td>
                    <td>{new Date(progress.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="notification is-warning">
          <p>No progress data available for this initiative yet.</p>
          <p>Encourage employees to start tracking their progress!</p>
        </div>
      )}
    </div>
  );
};

export default CompanyProgressDashboard;