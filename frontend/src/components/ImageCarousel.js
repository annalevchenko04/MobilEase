import React, { useEffect, useState } from 'react';

const ImageCarousel = () => {
  const images = [
      '/images/p1.png',
    '/images/p7.png',
    '/images/p5.png',
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Change the current image every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length); // Go to the next image, loop back to first
    }, 3200);

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, [images.length]);

  return (
    <div>
      <div
        className="carousel-images"
        style={{
          display: 'flex',
          transition: 'transform 0.5s ease-in-out',
          transform: `translateX(-${currentIndex * 100}%)`, // Move to the next image
        }}
      >
        {images.map((image, index) => (
          <div key={index} className="carousel-image">
            <img src={image} alt={`carousel-image-${index}`} className="carousel-img" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
