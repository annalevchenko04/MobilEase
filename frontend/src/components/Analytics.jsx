import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import * as XLSX from "xlsx";
import UserAvatar from "./UserAvatar";
import CategoryBreakdownChart from "./Charts/CategoryBreakdownChart";
import ActivityComparisonChart from "./Charts/ActivityComparisonChart";
import EmployeeComparisonChart from "./Charts/EmployeeComparisonChart";
import BenchmarkingGaugeChart from "./Charts/BenchmarkingGaugeChart";
import FootprintHistoryChart from "./Charts/FootprintHistoryChart";


const Analytics = () => {
  const [employees, setEmployees] = useState([]);
  const [fallbackValues, setFallbackValues] = useState({});
  const [currentFootprint, setCurrentFootprint] = useState(0);
  const [token, userRole, username, userId] = useContext(UserContext);

  const exportToExcel = () => {
  if (!employees || employees.length === 0) return;

  const data = employees.map(emp => ({
    Name: emp.name,
    Surname: emp.surname,
    Email: emp.email,
    Phone: emp.phone,
    Role: emp.role,
    Footprint: emp.total_footprint || fallbackValues[emp.id] || 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

  XLSX.writeFile(workbook, "employee_footprints.xlsx");
};

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem("token");
      if (!token || userRole !== "admin") return;
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
        const uniqueEmployees = Array.from(new Map(data.map(emp => [emp.id, emp])).values());
        setEmployees(uniqueEmployees);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };

    fetchEmployees();
  }, [userRole]);

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

  useEffect(() => {
    const fetchMemberStats = async () => {
      if (userRole !== "member") return;
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8000/company/footprint-stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        setEmployees([
          { id: 1, name: "You", totalFootprint: data.your_footprint || 0 },
          { id: 2, name: "Company Avg", totalFootprint: data.average },
          { id: 3, name: "Max in Company", totalFootprint: data.maximum },
        ]);

        setCurrentFootprint(data.your_footprint || 0);
      } catch (err) {
        console.error("Failed to load company stats:", err);
      }
    };

    fetchMemberStats();
  }, [userRole]);

  useEffect(() => {
    const fetchAdminFootprint = async () => {
      if (userRole !== "admin") return;
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8000/get_footprint", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCurrentFootprint(data.total_carbon_footprint_kg || 0);
      } catch (err) {
        console.error("Error fetching admin footprint:", err);
      }
    };

    fetchAdminFootprint();
  }, [userRole]);

  let employeeComparisonData = [];

  if (userRole === "admin") {
    employeeComparisonData = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      surname: emp.surname,
      totalFootprint: emp.total_footprint || fallbackValues[emp.id] || 0,
    }));
  } else {
    employeeComparisonData = employees.map(emp => ({
      name: emp.name,
      surname: emp.surname,
      totalFootprint: emp.totalFootprint,
    }));
  }

  const [categoryData, setCategoryData] = useState({});
  useEffect(() => {
  const fetchCategoryBreakdown = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/category-breakdown", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Failed to fetch category breakdown");
        return;
      }
      const data = await res.json();
      setCategoryData(data.category_breakdown || {});
      console.log("Category breakdown data from API:", data);

    } catch (err) {
      console.error("Error fetching category breakdown:", err);
    }

  };

  fetchCategoryBreakdown();
}, []);

  const [historyData, setHistoryData] = useState([]);

useEffect(() => {
  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/footprint/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error("Failed to fetch footprint history:", err);
    }
  };
  fetchHistory();
}, []);



  const activityData = {
    "Electricity Usage": 587,
    "Car Km": 1044,
    "Flights per Year": 3,
    "Clothing Spend": 63,
    "Food Waste": 8,
  };

  const targetFootprint = 600;
  const showScrollable = userRole === "admin" && employeeComparisonData.length > 20;

  return (
    <div>
      <h2 className="title is-2">Analytics</h2>

      {userRole === "admin" && (
  <button className="button is-primary" onClick={exportToExcel}>
    Export Employee Data to Excel
  </button>
)}


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          maxWidth: "850px",
          margin: "40px auto",
        }}
      >
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <CategoryBreakdownChart data={categoryData} />
        </div>
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <FootprintHistoryChart data={historyData} />
        </div>

        {showScrollable ? (
          <div style={{ overflowX: "auto", maxWidth: "850px" }}>
            <div style={{ width: "1200px", margin: "0 auto" }}>
              <EmployeeComparisonChart employees={employeeComparisonData} />
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: "850px", margin: "0 auto" }}>
            <EmployeeComparisonChart employees={employeeComparisonData} />
          </div>
        )}

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
