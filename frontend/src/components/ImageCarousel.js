import React, { useEffect, useState, useRef } from 'react';

const ImageCarousel = () => {
  const images = [
    '/images/p1.png',
    '/images/p7.png',
    '/images/p5.png',
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isForward, setIsForward] = useState(true); // Flag to track direction
  const carouselRef = useRef(null);

  useEffect(() => {
    const handleIntersection = (entries) => {
      const [entry] = entries;
      setIsInView(entry.isIntersecting); // If the component is in view, set state to true
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: null, // Observe relative to the viewport
      threshold: 0.5, // Trigger when 50% of the element is in view
    });

    if (carouselRef.current) {
      observer.observe(carouselRef.current);
    }

    return () => {
      if (carouselRef.current) {
        observer.unobserve(carouselRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isInView) return; // Don't start the carousel if it's not in view

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (isForward) {
          // Move forward
          if (prevIndex + 1 >= images.length) {
            setIsForward(false); // Reverse the direction
            return prevIndex - 1; // Move backward
          }
          return prevIndex + 1;
        } else {
          // Move backward
          if (prevIndex - 1 < 0) {
            setIsForward(true); // Switch back to forward direction
            return prevIndex + 1; // Move forward
          }
          return prevIndex - 1;
        }
      });
    }, 2000);

    return () => clearInterval(interval); // Clean up the interval when the component goes out of view or is unmounted
  }, [isInView, isForward, images.length]);

  return (
    <div ref={carouselRef}>
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
