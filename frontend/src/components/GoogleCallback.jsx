import { useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const GoogleCallback = () => {
  const [, , , , setToken] = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔵 GoogleCallback mounted");

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("access_token");

    console.log("🔵 GoogleCallback extracted token:", token);

    if (token) {
      console.log("🔵 Saving token to localStorage...");
      localStorage.setItem("token", token);

      console.log("🔵 Calling setToken...");
      setToken(token);

      console.log("🔵 localStorage now:", localStorage.getItem("token"));

      navigate("/main");
    } else {
      console.log("🔴 No token found in callback URL");
      navigate("/main");
    }
  }, []);

  return <p>Signing you in...</p>;
};

export default GoogleCallback;