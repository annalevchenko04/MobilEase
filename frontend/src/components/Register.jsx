import React, { useContext, useState } from "react";
import { UserContext } from "../context/UserContext";
import ErrorMessage from "./ErrorMessage";
import { FaClipboardCheck } from "react-icons/fa";
import API_URL from "../config";

const Register = ({ toggleForm }) => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [, , , , setToken] = useContext(UserContext);
  const [gender, setGender] = useState("");

  // --- Field-level error states ---
  const [errors, setErrors] = useState({});

  // Validate a single field and return error string or ""
  const validateField = (field, value) => {
    switch (field) {
      case "username":
        if (!value.trim()) return "Username is required.";
        if (value.length < 3) return "Username must be at least 3 characters.";
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Username can only contain letters, numbers, and underscores.";
        return "";

      case "name":
        if (!value.trim()) return "Name is required.";
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Name can only contain letters.";
        return "";

      case "surname":
        if (!value.trim()) return "Surname is required.";
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Surname can only contain letters.";
        return "";

      case "age":
        if (!value) return "Age is required.";
        if (parseInt(value) < 16) return "You must be at least 16 years old.";
        if (parseInt(value) > 120) return "Please enter a valid age.";
        return "";

      case "phone":
        if (!value.trim()) return "Phone number is required.";
        if (!/^\d+$/.test(value)) return "Phone number can only contain digits.";
        if (value.length < 7 || value.length > 15) return "Phone number must be between 7 and 15 digits.";
        return "";

      case "email":
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
        return "";

      case "gender":
        if (!value) return "Please select a gender.";
        return "";

      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter.";
        if (!/[0-9]/.test(value)) return "Password must contain at least one number.";
        return "";

      case "confirmationPassword":
        if (!value) return "Please confirm your password.";
        if (value !== password) return "Passwords do not match.";
        return "";

      default:
        return "";
    }
  };

  // Update field and validate on change
  const handleChange = (field, value, setter) => {
    setter(value);
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Phone: only allow digits to be typed
  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, ""); // strip any non-digit
    setPhone(digits);
    const error = validateField("phone", digits);
    setErrors((prev) => ({ ...prev, phone: error }));
  };

  // Age: only allow positive integers
  const handleAgeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setAge(val);
    const error = validateField("age", val);
    setErrors((prev) => ({ ...prev, age: error }));
  };

  // Validate all fields before submit
  const validateAll = () => {
    const fields = { username, name, surname, age, phone, email, gender, password, confirmationPassword };
    const newErrors = {};
    let valid = true;
    for (const [field, value] of Object.entries(fields)) {
      const error = validateField(field, value);
      newErrors[field] = error;
      if (error) valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const submitRegistration = async () => {
    const userData = {
      username,
      name,
      surname,
      age: parseInt(age, 10) || 0,
      gender,
      phone,
      email,
      password,
      role: "member",
      weight: 0,
      height: 0,
      membership_status: "None",
    };

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      // Auto-login after successful registration
      const formDetails = new URLSearchParams();
      formDetails.append("username", username);
      formDetails.append("password", password);

      const loginResponse = await fetch(`${API_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formDetails,
      });

      if (!loginResponse.ok) {
        const loginError = await loginResponse.json();
        throw new Error(loginError.detail || "Login failed");
      }

      const loginData = await loginResponse.json();
      localStorage.setItem("token", loginData.access_token);
      setToken(loginData.access_token);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (validateAll()) {
      submitRegistration();
    }
  };

  // Helper: renders red error text under a field
  const FieldError = ({ field }) =>
    errors[field] ? (
      <p className="help is-danger" style={{ marginTop: "4px" }}>
        {errors[field]}
      </p>
    ) : null;

  // Helper: adds "is-danger" class to input when there's an error
  const inputClass = (field) => `input${errors[field] ? " is-danger" : ""}`;

  return (
    <div className="column is-half is-offset-one-quarter">
      <form
        className="box"
        onSubmit={handleSubmit}
        style={{ border: "2px solid #191317", padding: "20px", borderRadius: "8px" }}
      >
        <h1 className="title has-text-centered">Register</h1>

        {/* Username */}
        <div className="field">
          <label className="label">Username</label>
          <div className="control">
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => handleChange("username", e.target.value, setUsername)}
              className={inputClass("username")}
              required
            />
          </div>
          <FieldError field="username" />
        </div>

        {/* Name and Surname */}
        <div className="field is-grouped">
          <div className="control is-expanded">
            <label className="label">Name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => handleChange("name", e.target.value, setName)}
              className={inputClass("name")}
              required
            />
            <FieldError field="name" />
          </div>
          <div className="control is-expanded">
            <label className="label">Surname</label>
            <input
              type="text"
              placeholder="Enter surname"
              value={surname}
              onChange={(e) => handleChange("surname", e.target.value, setSurname)}
              className={inputClass("surname")}
              required
            />
            <FieldError field="surname" />
          </div>
        </div>

        {/* Age */}
        <div className="field">
          <label className="label">Age</label>
          <div className="control">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter age"
              value={age}
              onChange={handleAgeChange}
              className={inputClass("age")}
              required
            />
          </div>
          <FieldError field="age" />
        </div>

        {/* Phone — digits only */}
        <div className="field">
          <label className="label">Phone</label>
          <div className="control">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter phone number (digits only)"
              value={phone}
              onChange={handlePhoneChange}
              className={inputClass("phone")}
              required
            />
          </div>
          <FieldError field="phone" />
        </div>

        {/* Email */}
        <div className="field">
          <label className="label">Email Address</label>
          <div className="control">
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => handleChange("email", e.target.value, setEmail)}
              className={inputClass("email")}
              required
            />
          </div>
          <FieldError field="email" />
        </div>

        {/* Gender */}
        <div className="field">
          <label className="label">Gender</label>
          <div className="control">
            <div className={`select${errors.gender ? " is-danger" : ""}`}>
              <select
                value={gender}
                onChange={(e) => handleChange("gender", e.target.value, setGender)}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <FieldError field="gender" />
        </div>

        {/* Password */}
        <div className="field">
          <label className="label">Password</label>
          <div className="control">
            <input
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={password}
              onChange={(e) => handleChange("password", e.target.value, setPassword)}
              className={inputClass("password")}
              required
            />
          </div>
          <FieldError field="password" />
        </div>

        {/* Confirm Password */}
        <div className="field">
          <label className="label">Confirm Password</label>
          <div className="control">
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmationPassword}
              onChange={(e) => handleChange("confirmationPassword", e.target.value, setConfirmationPassword)}
              className={inputClass("confirmationPassword")}
              required
            />
          </div>
          <FieldError field="confirmationPassword" />
        </div>

        {/* Backend error (e.g. "User already exists") */}
        <ErrorMessage message={errorMessage} />

        <br />
        <div className="has-text-centered">
          <button className="bg-[#376243] text-black font-bold px-4 py-2 rounded-md flex items-center gap-2">
            <FaClipboardCheck size={27}/>
          </button>
        </div>

        <br />
        <div className="has-text-centered">
          <p>
            Already have an account?{" "}
            <a href="#" onClick={toggleForm}>
              Login here
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register;
