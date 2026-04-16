import React, { useState } from "react";
import API_URL from "../config";
import ErrorMessage from "./ErrorMessage";

const DriverRegister = () => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [licenseNumber, setLicenseNumber] = useState("");
  const [salaryRate, setSalaryRate] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const submitDriverRegistration = async () => {
    const userData = {
      username,
      name,
      surname,
      age: parseInt(age, 10),
      gender,
      phone,
      email,
      password,
      role: "driver",
      license_number: licenseNumber,
      salary_rate: parseFloat(salaryRate),
    };

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Driver registration failed");
      }

      alert("Driver registered successfully!");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    submitDriverRegistration();
  };

  return (
    <div className="column is-half is-offset-one-quarter">
      <form className="box" onSubmit={handleSubmit}>
        <h1 className="title has-text-centered">Register Driver</h1>

        <ErrorMessage message={errorMessage} />

        <div className="field">
          <label className="label">Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="field is-grouped">
          <div className="control is-expanded">
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="control is-expanded">
            <label className="label">Surname</label>
            <input className="input" value={surname} onChange={(e) => setSurname(e.target.value)} required />
          </div>
        </div>

        <div className="field">
          <label className="label">Age</label>
          <input className="input" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
        </div>

        <div className="field">
          <label className="label">Gender</label>
          <div className="select">
            <select value={gender} onChange={(e) => setGender(e.target.value)} required>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>

        <div className="field">
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="field">
          <label className="label">License Number</label>
          <input className="input" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
        </div>

        <div className="field">
          <label className="label">Salary Rate (€ per hour)</label>
          <input className="input" type="number" value={salaryRate} onChange={(e) => setSalaryRate(e.target.value)} required />
        </div>

        <div className="field">
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div className="field">
          <label className="label">Confirm Password</label>
          <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>

        <p>*Set 123456 as password. Inform a driver to change it after login.</p>
        <p>**Driver email should be @mobilease.com.</p>
        <br/>
        <button className="button is-primary is-fullwidth">Register Driver</button>
      </form>
    </div>
  );
};

export default DriverRegister;