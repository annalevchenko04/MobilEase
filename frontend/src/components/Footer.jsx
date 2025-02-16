import React from "react";
import '../styles.css';
const Footer = () => {
  return (
      <footer className="footer" style={{
          position: 'relative', // To position content above the image
          padding: '20px',
          textAlign: 'center',
          width: '100%',
          color: 'white',
      }}>
          {/* Blurred Background Image */}
          <img
              src="/images/footer.png"
              alt="Footer Background"
              style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', // Ensures the image covers the entire footer area
                  filter: 'blur(3px)', // Apply blur effect
                  zIndex: 0, // Ensures the image is behind the content
              }}
          />

          {/* Optional Overlay (if you want a darker effect for readability) */}
          <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0, // Keeps overlay below the content
          }}></div>

          {/* Footer Content */}
          <div style={{zIndex: 1, position: 'relative', color: "black"}}>
              <p>
                 <strong> &copy; {new Date().getFullYear()} Employee Sustainability Page. All rights reserved. </strong>
              </p>
          </div>
      </footer>


  );
};

export default Footer;