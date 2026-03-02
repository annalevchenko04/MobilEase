import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/UserContext";

const Header = ({ title }) => {
  return (
    <header>
      <div
        style={{
          position: "relative", // Position content above the image
          padding: "30px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Blurred Image */}
        <img
          src="/images/img_8.png"
          alt="Background"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) scale(0.8)", // 50% size
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "blur(1px)",
            zIndex: 0,
          }}
        />

        {/* Content */}
          <div
              style={{
                  zIndex: 1, // Content stays above the image
                  textAlign: "center",
              }}
          >
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <h1
                  className="title"
                  style={{
                      color: "black", // White text color
                      margin: "0",
                      fontSize: "3rem", // Increase text size
                      borderTop: "3px solid black", // Black thin line above the text
                      borderBottom: "3px solid black", // Black thin line below the text
                      paddingTop: "10px",
                      paddingBottom: "10px", // Add space between the line and text
                  }}
              >
                  {title}
              </h1>
          </div>
      </div>
    </header>
  );
};

export default Header;
