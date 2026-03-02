import React, { useEffect, useState, useCallback, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { Link } from "react-router-dom";
import API_URL from "../config";

const ExploreRent = () => {
  const [cars, setCars] = useState([]);
  const [carImages, setCarImages] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const [token] = useContext(UserContext);

  // Filters
  const [brand, setBrand] = useState("");
  const [year, setYear] = useState("");
  const [transmission, setTransmission] = useState("");

  // Sorting
  const [sortOption, setSortOption] = useState("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;

  // Fetch cars
  const fetchCars = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/cars`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error fetching cars");

      const data = await response.json();
      setCars(data);

      const imagesMap = {};
      data.forEach((car) => {
        imagesMap[car.id] = car.images || [];
      });

      setCarImages(imagesMap);
    } catch (error) {
      setErrorMessage("Could not fetch cars.");
    }
  }, [token]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  // Sorting
  const sortCars = (cars) => {
    const sorted = [...cars];
    if (sortOption === "newest") {
      sorted.sort((a, b) => b.id - a.id);
    } else {
      sorted.sort((a, b) => a.id - b.id);
    }
    return sorted;
  };

  // Filters
  const filterCars = (cars) => {
    return cars.filter((car) => {
      const matchBrand = brand
        ? car.brand.toLowerCase().includes(brand.toLowerCase())
        : true;

      const matchYear = year ? car.year.toString() === year : true;

      const matchTransmission = transmission
        ? car.transmission.toLowerCase() === transmission.toLowerCase()
        : true;

      return matchBrand && matchYear && matchTransmission;
    });
  };

  const filteredCars = filterCars(sortCars(cars));

  // Pagination
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const currentCars = filteredCars.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div>
      <h2 className="title is-2">Explore Cars</h2>

      {errorMessage && (
        <p className="has-text-centered" style={{ color: "#f14668" }}>
          {errorMessage}
        </p>
      )}

      {/* SEARCH BAR */}
      <div className="box" style={{ marginBottom: "30px", border: "3px solid #605fc9" }}>
        <h3 className="title is-4">Search Cars</h3>

        <div className="columns">
          <div className="column">
            <label className="label">Brand</label>
            <input
              className="input"
              type="text"
              placeholder="e.g., Nissan"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="column">
            <label className="label">Year</label>
            <input
              className="input"
              type="number"
              placeholder="e.g., 2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <div className="column">
            <label className="label">Transmission</label>
            <div className="select is-fullwidth">
              <select value={transmission} onChange={(e) => setTransmission(e.target.value)}>
                <option value="">Any</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SORTING */}
      <div className="is-centered" style={{ marginBottom: "50px" }}>
        <div className="select">
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* CARS GRID */}
      {filteredCars.length === 0 ? (
        <p className="has-text-centered" style={{ color: "#888", fontSize: "1.2em" }}>
          No cars found
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {currentCars.map((car) => (
            <div
              key={car.id}
              className="box"
              style={{ position: "relative", maxHeight: "500px", border: "3px solid #605fc9" }}
            >
              <h5 className="title is-5">
                {car.brand} {car.model} ({car.year})
              </h5>

              <div className="tags">
                <span className="tag is-link is-rounded">{car.transmission}</span>
                <span className="tag is-link is-rounded">{car.fuel_type}</span>
                <span className="tag is-link is-rounded">{car.seats} seats</span>
              </div>

              {/* IMAGE */}
              {carImages[car.id]?.length > 0 ? (
                <figure style={{ width: "100%", height: "200px", overflow: "hidden", margin: 0 }}>
                  <img
                    src={`${API_URL}${carImages[car.id][0].url}`}
                    alt={car.brand}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </figure>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "200px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f0f0f0",
                    color: "#888",
                  }}
                >
                  No Image Available
                </div>
              )}

              <p style={{ marginTop: "10px", textAlign: "center" }}>
                <strong>€{car.price_per_hour}</strong>/hour &nbsp;
                <strong>€{car.price_per_day}</strong>/day &nbsp;
                <strong>€{car.price_per_km}</strong>/km
              </p>
              <br/>
              <br/>
              <p
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                }}
              >
                <Link to={`/car/${car.id}`} className="button is-link is-outlined">
                  View Details
                </Link>
              </p>

            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      <div
        className="pagination"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "20px",
          gap: "10px",
        }}
      >
        <button
          className="button is-primary"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          &lt;
        </button>

        <span style={{ fontSize: "1.2em", fontWeight: "bold" }}>
          {currentPage + 1} / {totalPages}
        </span>

        <button
          className="button is-primary"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default ExploreRent;