import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "./ErrorMessage";
import { FaClipboardCheck, FaArrowLeft } from "react-icons/fa";

const CompanyRegister = () => {
  const navigate = useNavigate(); // Navigation Hook

  // Company State
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [domain, setDomain] = useState("");

  // Admin User State
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Admin Password
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [gender, setGender] = useState("");
  const extractedDomain = email.trim().split("@")[1];
  const industries = [
    "Technology", "Finance", "Healthcare", "Education",
    "Retail", "Manufacturing", "Real Estate", "Transportation",
    "Hospitality", "Energy"
  ];

  // ✅ Function to Submit Registration
const submitRegistration = async () => {
  if (password !== confirmationPassword) {
    setErrorMessage("Passwords do not match.");
    return;
  }

  const requestData = {
    company_data: {
    name: companyName.trim(),
    industry,
    domain: extractedDomain, // 👈 use the extracted domain
  },
  user_data: {
    username: username.trim(),
    name: name.trim(),
    surname: surname.trim(),
    age: parseInt(age, 10) || 0,
    gender,
    phone: phone.trim(),
    email: email.trim(),
    password,
    role: "admin",
  },
};

  console.log("📤 Sending Data:", JSON.stringify(requestData, null, 2));

  try {
    const response = await fetch("http://localhost:8000/register-company/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("❌ API Error Response:", responseData);
      setErrorMessage(responseData.detail || "Company registration failed.");
      return;
    }

    alert("✅ Company registered successfully!");
    navigate("/main");

  } catch (error) {
  try {
    const errorResponse = await error.response.json();
    console.error("❌ API Error Response:", errorResponse);

    if (errorResponse.detail) {
      if (typeof errorResponse.detail === "string") {
        setErrorMessage(errorResponse.detail); // Show specific error
      } else if (Array.isArray(errorResponse.detail)) {
        setErrorMessage(errorResponse.detail.map(e => e.msg).join(", "));
      }
    } else {
      setErrorMessage("Company registration failed.");
    }
  } catch (parseError) {
    console.error("❌ Error parsing response:", parseError);
    setErrorMessage("Unexpected error occurred.");
  }
}

};


  return (
    <div className="column is-half is-offset-one-quarter">
      <form
        className="box"
        onSubmit={(e) => {
          e.preventDefault();
          submitRegistration();
        }}
        style={{ border: "2px solid #191317", padding: "20px", borderRadius: "8px" }}
      >
        <h1 className="title has-text-centered">Register Your Company</h1>

        {/* Company Name */}
        <div className="field">
          <label className="label">Company Name</label>
          <div className="control">
            <input
              type="text"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        {/* Industry */}
        <div className="field">
          <label className="label">Industry</label>
          <div className="control">
            <div className="select">
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} required>
                <option value="">Select Industry</option>
                {industries.map((ind, index) => (
                  <option key={index} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr />

        {/* Username */}
        <div className="field">
          <label className="label">Username</label>
          <div className="control">
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        {/* Name and Surname */}
        <div className="field is-grouped">
          <div className="control is-expanded">
            <label className="label">Name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="control is-expanded">
            <label className="label">Surname</label>
            <input
              type="text"
              placeholder="Enter surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        {/* Gender */}
        <div className="field">
          <label className="label">Gender</label>
          <div className="control">
            <div className="select">
              <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* Age */}
<div className="field">
  <label className="label">Age</label>
  <div className="control">
    <input
      type="number"
      placeholder="Enter age"
      value={age}
      onChange={(e) => setAge(e.target.value)} // ✅ This ensures setAge is used
      className="input"
      required
    />
  </div>
</div>

{/* Phone */}
<div className="field">
  <label className="label">Phone</label>
  <div className="control">
    <input
      type="text"
      placeholder="Enter phone number"
      value={phone}
      onChange={(e) => setPhone(e.target.value)} // ✅ This ensures setPhone is used
      className="input"
      required
    />
  </div>
</div>


        {/* Email */}
        <div className="field">
          <label className="label">Email Address</label>
          <div className="control">
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="field">
          <label className="label">Password</label>
          <div className="control">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="field">
          <label className="label">Confirm Password</label>
          <div className="control">
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmationPassword}
              onChange={(e) => setConfirmationPassword(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        <ErrorMessage message={errorMessage} />

        {/* Register Company Button */}
        <div className="has-text-centered">
          <button type="submit" className="bg-[#376243] text-black font-bold px-4 py-2 rounded-md flex items-center gap-2">
            <FaClipboardCheck size={27}/>
            Register Company
          </button>
        </div>

        {/* Back to User Registration */}
        <br />
        <div className="has-text-centered">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="bg-gray-400 text-black font-bold px-4 py-2 rounded-md flex items-center gap-2"
          >
            <FaArrowLeft size={20} />
            Register as Employee
          </button>
        </div>

      </form>
    </div>
  );
};

export default CompanyRegister;