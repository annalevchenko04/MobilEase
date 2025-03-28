import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import UserAvatar from "./UserAvatar";
const Analytics = () => {
  const [employees, setEmployees] = useState([]);
  const [token, userRole, username, userId,] = useContext(UserContext);

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
                        <figure className="media-left" style={{marginRight: "10px"}}>
                          <p className="image is-48x48">
                            <UserAvatar user_id={emp.id}/>
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
      </div>
  );
};
export default Analytics;