import React, { useState, useContext } from "react";
import ErrorMessage from "./ErrorMessage";
import { UserContext } from "../context/UserContext";
import { FaSignInAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Login = ({ toggleForm }) => {
  const [Username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [,,,,setToken] = useContext(UserContext);
  const navigate = useNavigate();
  const submitLogin = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: Username,
        password: password,
      }),
    };

    const response = await fetch("http://localhost:8000/token", requestOptions);
    const data = await response.json();

    if (!response.ok) {
      setErrorMessage(data.detail);
    } else {
      setToken(data.access_token);
      localStorage.setItem("token", data.access_token);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitLogin();
  };

  return (
      <div className="column is-half is-offset-one-quarter py-6" style={{minHeight: "600px"}}>
        <br/>
        <br/>
        <br/>
        <form
            className="box"
            onSubmit={handleSubmit}
            style={{border: '2px solid #191317', padding: '20px', borderRadius: '8px'}} // Add border and padding
        >
          <h1 className="title has-text-centered">Login</h1>

          <div className="field">
            <label className="label">Username</label>
            <div className="control has-icons-left">
              <input
                  type="text"
                  placeholder="Enter username"
                  value={Username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  required
              />
              <span className="icon is-small is-left">
                  <i className="fas fa-user"></i>
              </span>
            </div>
          </div>

          <div className="field">
            <label className="label">Password</label>
            <div className="control has-icons-left">
              <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  required
              />
              <span className="icon is-small is-left">
                  <i className="fas fa-lock"></i>
              </span>
            </div>
          </div>


          <ErrorMessage message={errorMessage}/>

          <br/>
          <div className="has-text-centered">
            <button className="bg-[#376243] text-black font-bold px-4 py-2 rounded-md flex items-center gap-2">
              <FaSignInAlt size={20}/>
            </button>
          </div>

          <br/>
          <div className="has-text-centered">
            <p>
              Don't have an account?{" "}
              <a href="#" onClick={toggleForm}>
                Back to Register
              </a>
            </p>
            <br/>
            <p>
              Want to register your company?{" "}
              <a href="#" onClick={(e) => {
                e.preventDefault();
                navigate("/register-company");
              }}>
                Register Company
              </a>
            </p>
          </div>
        </form>
      </div>
  );
};

export default Login;
