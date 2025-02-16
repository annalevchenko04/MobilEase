import React, {useContext, useEffect, useState} from "react";
import Register from './components/Register.jsx';
import Header from './components/Header.jsx';
import Login from './components/Login.jsx';
import {UserContext} from "./context/UserContext";
import {Route, Routes, Navigate} from "react-router-dom";  // Import routing components
import Footer from './components/Footer';  // Import the Footer component
import UserProfile from "./components/UserProfile";
import Main from "./components/Main";
import Calculator from './components/Calculator';
import Analytics from './components/Analytics';
import Explore from './components/Explore';
import './styles.css';


const App = () => {
    const [token, , , , setToken] = useContext(UserContext); // Use userRole from context
    const [isLogin, setIsLogin] = useState(true);  // State to toggle between login and register
    const [, setRemainingTime] = useState(null);
    const [isBurgerActive, setIsBurgerActive] = useState(false);

    const handleBurgerClick = () => {
        setIsBurgerActive(!isBurgerActive);
    };

    useEffect(() => {
        if (!token) {
            setRemainingTime(null);
            return;
        }

        const decodeToken = (token) => {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                return payload.exp ? payload.exp * 1000 : null;
            } catch {
                console.error("Invalid token format.");
                return null;
            }
        };

        const updateRemainingTime = () => {
            const expTime = decodeToken(token);
            const timeLeft = expTime - Date.now();
            setRemainingTime(timeLeft > 0 ? timeLeft : null);

            if (timeLeft <= 0) {
                handleLogout();
            }
        };

        updateRemainingTime();
        const intervalId = setInterval(updateRemainingTime, 1000);

        return () => clearInterval(intervalId);
    }, [token]);

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem("token");
    };

    return (
        <div className="app-container">
            <Header title={"Employee Sustainability Portal"}/>
            {token && (
                <nav className="navbar is-light is-spaced has-shadow p-3">
                    <div className="container">
                        {/* Navbar Brand */}
                        <div className="navbar-brand">

                                <a className="navbar-item has-text-weight-bold is-size-4" href="/main">
                                    <i className="fas fa-bars"></i>
                                </a>
                            {/* Burger menu for smaller screens */}
                            <a
                                role="button"
                                className={`navbar-burger ${isBurgerActive ? 'is-active' : ''}`}
                                aria-label="menu"
                                aria-expanded="false"
                                onClick={handleBurgerClick}
                            >
                                <span aria-hidden="true"></span>
                                <span aria-hidden="true"></span>
                                <span aria-hidden="true"></span>
                            </a>
                        </div>

                        {/* Navbar Menu */}
                        <div className={`navbar-menu ${isBurgerActive ? 'is-active' : 'is-centered'}`}>

                            <div className="navbar-start">
                                {token && (
                                    <>
                                        <a className="navbar-item" href="/profile">
                                    <span className="icon-text">
                                        <span className="icon">
                                            <i className="fas fa-user"></i>
                                        </span>
                                        <span><strong>My Profile</strong></span>
                                    </span>
                                        </a>

                                        <a className="navbar-item" href="/footprint">
                                    <span className="icon-text">
                                        <span className="icon">
                                            <i className="fas fa-calculator"></i>
                                        </span>
                                        <span><strong>Footprint Calculator</strong></span>
                                    </span>
                                        </a>

                                        <a className="navbar-item" href="/analytics">
                                    <span className="icon-text">
                                        <span className="icon">
                                            <i className="fas fa-chart-line"></i>
                                        </span>
                                        <span><strong>Analytics</strong></span>
                                    </span>
                                        </a>

                                        <a className="navbar-item" href="/explore">
                                    <span className="icon-text">
                                        <span className="icon">
                                            <i className="fas fa-list-alt"></i>
                                        </span>
                                        <span><strong>Explore</strong></span>
                                    </span>
                                        </a>
                                        
                                        <div className="navbar-end">
                                            <br/>
                                            <div className="navbar-item">
                                                <button
                                                    className="button is-danger is-light has-text-weight-bold"
                                                    onClick={handleLogout}
                                                >
                                                    <i className="fas fa-sign-out-alt"></i>
                                                    Logout
                                                </button>
                                            </div>
                                        </div>

                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                </nav>
            )}

            <div className="columns">
                <div className="column"></div>
                <div className="column m-5 is-two-thirds">
                    <Routes>
                        {!token ? (
                            <>
                                {/* Redirect to log in if not authenticated */}
                                <Route path="/" element={isLogin ? <Login toggleForm={() => setIsLogin(false)}/> :
                                    <Register toggleForm={() => setIsLogin(true)}/>}/>
                                <Route path="*" element={<Navigate to="/"/>}/>
                            </>
                        ) : (
                            <>
                                {/* Redirect to schedule if authenticated */}
                                <Route path="/profile" element={<UserProfile/>}/>
                                <Route path="/main" element={<Main/>}/>
                                <Route path="/footprint" element={<Calculator/>}/>
                                <Route path="/analytics" element={<Analytics/>}/>
                                <Route path="/explore" element={<Explore/>}/>
                                <Route path="*" element={<Navigate to="/main"/>}/>
                            </>
                        )}
                    </Routes>
                </div>
                <div className="column"></div>
            </div>

            <Footer/>
        </div>
    );
};

export default App;


