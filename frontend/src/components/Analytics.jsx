// Analytics.jsx
import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import UserAvatar from "./UserAvatar";
import CategoryBreakdownChart from "./Charts/CategoryBreakdownChart";
import ActivityComparisonChart from "./Charts/ActivityComparisonChart";
import EmployeeComparisonChart from "./Charts/EmployeeComparisonChart";
import BenchmarkingGaugeChart from "./Charts/BenchmarkingGaugeChart";

const Analytics = () => {
  const [employees, setEmployees] = useState([]);
  const [fallbackValues, setFallbackValues] = useState({});
  const [token, userRole, username, userId] = useContext(UserContext);

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:8000/admin/company-employees", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          console.error("Access denied or failed:", res.status);
          return;
        }
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };

    fetchEmployees();
  }, []);

  // Set fallback values when employees data is loaded
  useEffect(() => {
    if (employees.length > 0) {
      const newFallbacks = {};
      employees.forEach(emp => {
        if (!emp.total_carbon_footprint_kg) {
          newFallbacks[emp.id] = Math.floor(Math.random() * 500 + 100);
        }
      });
      setFallbackValues(newFallbacks);
    }
  }, [employees]);

  const employeeComparisonData = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    totalFootprint: emp.total_footprint || emp.total_carbon_footprint_kg || 0,
  }));

  // Sample data for the other charts
  const categoryData = {
    "Home Energy": 150,
    "Transportation": 300,
    "Food": 200,
    "Digital": 50,
    "Shopping/Leisure": 100,
  };

  const activityData = {
    "Electricity Usage": 587,
    "Car Km": 1044,
    "Flights per Year": 3,
    "Clothing Spend": 63,
    "Food Waste": 8,
  };

  // Sample values for the benchmarking gauge (adjust as needed)
  const currentFootprint = 400;
  const targetFootprint = 600;

  return (
    <div>
      <h2 className="title is-2">Analytics</h2>

      {userRole === "admin" && (
        <>
          <h2 className="title is-4">Your Company Employees</h2>
          <table className="table is-striped is-fullwidth">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <figure className="media-left" style={{ marginRight: "10px" }}>
                      <p className="image is-48x48">
                        <UserAvatar user_id={emp.id} />
                      </p>
                    </figure>
                  </td>
                  <td>{emp.name}</td>
                  <td>{emp.surname}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone}</td>
                  <td>{emp.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* First row: Category Breakdown and Activity Comparison */}
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)", // Two columns
    gap: "20px",
    maxWidth: "850px", // Optional: constrain overall width if needed
    margin: "40px auto" // Center the grid container horizontally with top margin
  }}
>
  <div style={{ maxWidth: "400px", margin: "0 auto" }}>
    <CategoryBreakdownChart data={categoryData} />
  </div>
  <div style={{ maxWidth: "400px", margin: "0 auto" }}>
    <ActivityComparisonChart data={activityData} />
  </div>
  <div style={{ maxWidth: "400px", margin: "0 auto" }}>
    <EmployeeComparisonChart employees={employeeComparisonData} />
  </div>
  <div style={{ maxWidth: "400px", margin: "0 auto" }}>
    <BenchmarkingGaugeChart
      currentValue={currentFootprint}
      targetValue={targetFootprint}
    />
  </div>
</div>

    </div>
  );
};

export default Analytics;
