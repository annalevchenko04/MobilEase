import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";
import {Link} from "react-router-dom";

const CarsManagement = () => {
  const [token, userRole, username, userId,] = useContext(UserContext);
  const [cars, setCars] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCarId, setCurrentCarId] = useState(null);
  const [carImages, setCarImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
const [existingCarImages, setExistingCarImages] = useState([]);
const isFieldInvalid = (field) => {
  return errorMessage.toLowerCase().includes(field.replace(/_/g, " "));
};
  const [newCar, setNewCar] = useState({
    brand: "",
    model: "",
    year: "",
    license_plate: "",
    seats: "",
    transmission: "",
    fuel_type: "",
    price_per_hour: "",
    price_per_day: "",
    price_per_km: "",
  });
  useEffect(() => {
  if (token) {
    fetchCars();
  }
}, [token]);
const formatLabel = (text) => {
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
useEffect(() => {
  if (isEditing && currentCarId) {
    setTimeout(() => {
      const currentCar = cars.find(car => car.id === currentCarId);
      if (currentCar) {
        setExistingCarImages(currentCar.images || []);

        setNewCar({
          brand: currentCar.brand || "",
          model: currentCar.model || "",
          year: currentCar.year || "",
          license_plate: currentCar.license_plate || "",
          seats: currentCar.seats || "",
          transmission: currentCar.transmission || "",
          fuel_type: currentCar.fuel_type || "",
          price_per_hour: currentCar.price_per_hour || "",
          price_per_day: currentCar.price_per_day || "",
          price_per_km: currentCar.price_per_km || "",
        });
      }
    }, 300);
  }
}, [isEditing, currentCarId, cars]);
  // Fetch cars
  const fetchCars = async () => {
  try {
    const response = await fetch(`${API_URL}/cars`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch cars");

    const data = await response.json();
    setCars(data);
  } catch (error) {
    console.error("Error fetching cars:", error);
  }
};
const handleRemoveNewCarImage = (indexToRemove) => {
  setCarImages(prev => prev.filter((_, index) => index !== indexToRemove));
};
const handleRemoveExistingCarImage = async (carId, imageId) => {
  try {
    const response = await fetch(`${API_URL}/cars/${carId}/images/${imageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to delete image");

    setExistingCarImages(prev =>
      prev.filter(image => image.id !== imageId)
    );
  } catch (error) {
    console.error("Error removing image:", error);
  }
};
const uploadCarImages = async (files, carId) => {
  const uploadPromises = files.map(file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result;

        try {
          const formData = new FormData();
          formData.append("image_data", base64data);

          const response = await fetch(`${API_URL}/cars/${carId}/image`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const imageResponse = await response.json();
          resolve(imageResponse);

        } catch (error) {
          reject(error);
        }
      };

      reader.readAsDataURL(file);
    });
  });

  try {
    const uploadedImages = await Promise.all(uploadPromises);
    setExistingCarImages(prev => [...prev, ...uploadedImages]);
  } catch (error) {
    console.error("Error uploading car images:", error);
  }
};

  // Handle input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCar((prev) => ({ ...prev, [name]: value }));
  };

  const requiredFields = [
  "brand",
  "model",
  "year",
  "license_plate",
  "seats",
  "transmission",
  "fuel_type",
  "price_per_hour",
  "price_per_day",
  "price_per_km",
];

const validateCar = () => {
  for (const field of requiredFields) {
    const value = newCar[field];

    if (!value || value.toString().trim() === "") {
      setErrorMessage(`${formatLabel(field)} is required`);
      return false;
    }

    // Extra validation for numbers
    if (
      ["year", "seats", "price_per_hour", "price_per_day", "price_per_km"].includes(field)
    ) {
      if (isNaN(value) || Number(value) <= 0) {
        setErrorMessage(`${formatLabel(field)} must be a valid number > 0`);
        return false;
      }
    }
  }

  setErrorMessage("");
  return true;
};
  const saveCar = async () => {
  // 🔴 VALIDATE FIRST
  if (!validateCar()) return;

  try {
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API_URL}/cars/${currentCarId}`
      : `${API_URL}/cars`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newCar),
    });

    if (!res.ok) throw new Error("Failed to save car");

    const data = await res.json();
    const carId = data.id;

    // ✅ Images are OPTIONAL
    if (carImages.length > 0) {
      await uploadCarImages(carImages, carId);
    }

    await fetchCars();

    setIsEditing(false);
    setIsCreating(false);
    setCarImages([]);
    setNewCar({
      brand: "",
      model: "",
      year: "",
      license_plate: "",
      seats: "",
      transmission: "",
      fuel_type: "",
      price_per_hour: "",
      price_per_day: "",
      price_per_km: "",
    });

  } catch (error) {
    console.error("Error saving car:", error);
    setErrorMessage("Something went wrong while saving.");
  }
};
  const editCar = (car) => {
  setIsEditing(true);
  setIsCreating(false);
  setCurrentCarId(car.id);
};

  // Delete modal
  const openDeleteModal = (id) => {
    setCarToDelete(id);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setCarToDelete(null);
  };

  const confirmDelete = async () => {
    await fetch(`${API_URL}/cars/${carToDelete}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    closeDeleteModal();
    fetchCars();
  };


  if (userRole !== "admin") return null;

  return (
    <>
  <div className="has-text-centered">
    <button
      className="button is-primary is-outlined is-medium"
      style={{ borderWidth: "3px" }}
      onClick={() => {
        setIsCreating(!isCreating);
        setIsEditing(false);

        // Reset all car fields
        setNewCar({
          brand: "",
          model: "",
          year: "",
          license_plate: "",
          seats: "",
          transmission: "",
          fuel_type: "",
          price_per_hour: "",
          price_per_day: "",
          price_per_km: "",
        });

        // Reset images
        setCarImages([]);
      }}
    >
      {isCreating ? <i className="fas fa-times"></i> : "Add New Car"}
    </button>
  </div>



            <br/>
            <br/>



      {/* DELETE MODAL */}
      {isModalOpen && (
        <div className="modal is-active">
          <div className="modal-background" onClick={closeDeleteModal}></div>
          <div className="modal-content">
            <div className="box">
              <h4 className="title is-4">Are you sure you want to delete this car?</h4>
              <div className="buttons is-right">
                <button className="button is-danger" onClick={confirmDelete}>
                  Yes, delete it
                </button>
                <button className="button" onClick={closeDeleteModal}>
                  No, cancel
                </button>
              </div>
            </div>
          </div>
          <button className="modal-close is-large" aria-label="close" onClick={closeDeleteModal}></button>
        </div>
      )}

      {/* CREATE / EDIT FORM */}
{isCreating && (
  <div className="box" style={{ border: "3px solid #605fc9" }}>
    <h3 className="title is-primary">Create a Car</h3>

    {errorMessage && (
      <div className="notification is-danger">
        <button className="delete" onClick={() => setErrorMessage("")}></button>
        {errorMessage}
      </div>
    )}

    {/* Brand */}
    <div className="field">
      <label className="label">Brand <span style={{ color: "red" }}>*</span></label>
      <div className="control">
        <input
          className="input"
          type="text"
          name="brand"
          placeholder="e.g., Toyota"
          value={newCar.brand}
          onChange={handleInputChange}
          style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
        />
      </div>
    </div>

    {/* Model */}
    <div className="field">
      <label className="label">
        Model <span style={{ color: "red" }}>*</span>
      </label>
      <div className="control">
        <input
          className="input"
          type="text"
          name="model"
          placeholder="e.g., Corolla"
          value={newCar.model}
          onChange={handleInputChange}
          style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
        />
      </div>
    </div>

    {/* Year */}
    <div className="field">
      <label className="label">
        Year <span style={{ color: "red" }}>*</span>
      </label>
      <div className="control">
        <input
          className="input"
          type="number"
          name="year"
          placeholder="e.g., 2020"
          value={newCar.year}
          onChange={handleInputChange}
          style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
        />
      </div>
    </div>

    {/* License Plate */}
    <div className="field">
      <label className="label">
        License Plate <span style={{ color: "red" }}>*</span>
      </label>
      <div className="control">
        <input
          className="input"
          type="text"
          name="license_plate"
          placeholder="e.g., ABC-123"
          value={newCar.license_plate}
          onChange={handleInputChange}
          style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
        />
      </div>
    </div>

    {/* Seats */}
    <div className="field">
      <label className="label">
        Seats <span style={{ color: "red" }}>*</span>
      </label>
      <div className="control">
        <input
          className="input"
          type="number"
          name="seats"
          placeholder="e.g., 5"
          value={newCar.seats}
          onChange={handleInputChange}
          style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
        />
      </div>
    </div>

   {/* Transmission */}
<div className="field">
  <label className="label">
      Transmission <span style={{ color: "red" }}>*</span>
    </label>
  <div className="control">
    <div className="select is-fullwidth">
      <select
        name="transmission"
        value={newCar.transmission}
        onChange={handleInputChange}
        style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
      >
        <option value="">Select transmission</option>
        <option value="automatic">Automatic</option>
        <option value="manual">Manual</option>
      </select>
    </div>
  </div>
</div>

{/* Fuel Type */}
<div className="field">
  <label className="label">
  Fuel Type <span style={{ color: "red" }}>*</span>
</label>
  <div className="control">
    <div className="select is-fullwidth">
      <select
        name="fuel_type"
        value={newCar.fuel_type}
        onChange={handleInputChange}
        style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
      >
        <option value="">Select fuel type</option>
        <option value="petrol">Petrol</option>
        <option value="diesel">Diesel</option>
        <option value="electric">Electric</option>
        <option value="hybrid">Hybrid</option>
      </select>
    </div>
  </div>
</div>

    {/* Price per hour */}
    <div className="field">
      <label className="label">
  Price per Hour (€) <span style={{ color: "red" }}>*</span>
</label>
      <div className="control">
        <input
          className="input"
          type="number"
          name="price_per_hour"
          placeholder="e.g., 10"
          value={newCar.price_per_hour}
          onChange={handleInputChange}
          style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
        />
      </div>
    </div>

    {/* Price per day */}
    <div className="field">
      <label className="label">
  Price per Day (€) <span style={{ color: "red" }}>*</span>
</label>
      <div className="control">
        <input
          className="input"
          type="number"
          name="price_per_day"
          placeholder="e.g., 50"
          value={newCar.price_per_day}
          onChange={handleInputChange}
          style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
        />
      </div>
    </div>

    {/* Price per km */}
    <div className="field">
<label className="label">
  Price per KM (€) <span style={{ color: "red" }}>*</span>
</label>
      <div className="control">
        <input
          className="input"
          type="number"
          name="price_per_km"
          placeholder="e.g., 0.20"
          value={newCar.price_per_km}
          onChange={handleInputChange}
          style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
        />
      </div>
    </div>

    {/* Images */}
    <div className="field">
      <label className="label">Car Images</label>
      <div className="control">
        <input
          type="file"
          className="input"
          multiple
          onChange={(e) => setCarImages(Array.from(e.target.files))}
          style={{
            border: "1px solid #605fc9",
            borderRadius: "12px",
          }}
        />
      </div>
    </div>

    {/* Preview selected images */}
    {carImages.length > 0 && (
      <div className="field">
        <p>Selected Images:</p>
        <ul>
          {carImages.map((image, index) => (
            <li
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <img
                src={URL.createObjectURL(image)}
                alt={`Selected ${index}`}
                width="100"
                style={{ marginRight: "10px" }}
              />
              <span>{image.name}</span>
              <button
                className="button is-danger is-light is-small"
                style={{
                  width: "30px",
                  height: "30px",
                  padding: "5px",
                  marginLeft: "10px",
                }}
                onClick={() =>
                  setCarImages(carImages.filter((_, i) => i !== index))
                }
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Save button */}
    <div className="control has-text-centered">
      <button className="button is-primary" onClick={saveCar}>
        <i className="fas fa-check"></i>
      </button>
    </div>


  </div>
)}
       <h3 className="title is-large">Cars</h3>
            {/* CAR GRID */}
      <div
        className="box"
        style={{
          border: "3px solid #605fc9",
          maxHeight: "650px",
          overflowY: "auto",
        }}
      >
        {cars.length === 0 ? (
          <p className="has-text-centered" style={{ color: "#888", fontSize: "1.2em" }}>
            No cars available
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "20px",
            }}
          >
            {cars.map((car) => (
              <div key={car.id} className="box" style={{ position: "relative", height: "465px" }}>
                <p
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    fontSize: "0.9em",
                    color: "black",
                  }}
                >
                  {car.license_plate}
                </p>

                <Link to={`/car/${car.id}`}>
                <h4 className="title is-5">{car.brand} {car.model} ({car.year})</h4>
                </Link>
<br />
              <div className="tags">
                <span className="tag is-link is-rounded">{car.transmission}</span>
                <span className="tag is-link is-rounded">{car.fuel_type}</span>
                <span className="tag is-link is-rounded">{car.seats} seats</span>
              </div>

                <br />

                {car.images && car.images.length > 0 ? (
                  <figure
                    style={{
                      width: "100%",
                      height: "200px",
                      overflow: "hidden",
                      margin: 0,
                    }}
                  >
                    <img
                      src={`${API_URL}${car.images[0].url}`}
                      alt={`${car.brand} ${car.model}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </figure>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "#f0f0f0",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
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

                <div className="buttons is-centered">
                  <button
                    className="button is-link is-light is-small"
                    style={{ width: "50px", height: "40px" }}
                    onClick={() => editCar(car)}
                  >
                    <i className="fas fa-pencil-alt"></i>
                  </button>

                  <button
                    className="button is-danger is-light is-small"
                    style={{ width: "50px", height: "40px" }}
                    onClick={() => openDeleteModal(car.id)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditing && (
          <div className="modal is-active">
            <div className="modal-background" onClick={() => setIsEditing(false)}></div>
            <div className="modal-card">

              <header className="modal-card-head has-background-link-light">
                <p className="modal-card-title">Edit Car</p>
                <i
                    className="fas fa-times close-icon"
                    onClick={() => setIsEditing(false)}
                    style={{fontSize: "24px", cursor: "pointer", color: "gray"}}
                ></i>
              </header>

              <section className="modal-card-body">

                {/* Car fields */}
{Object.keys(newCar).map((field) => (
  <div className="field" key={field}>
    <label className="label">
      {formatLabel(field)} <span style={{ color: "red" }}>*</span>
    </label>

    {/* SELECT for transmission */}
    {field === "transmission" ? (
      <div className="select is-fullwidth">
        <select
          name={field}
          value={newCar[field]}
          onChange={handleInputChange}
          style={{
            border: isFieldInvalid(field)
              ? "2px solid red"
              : "1px solid #605fc9",
            borderRadius: "12px",
          }}
        >
          <option value="">Select</option>
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
      </div>
    ) : field === "fuel_type" ? (
      /* SELECT for fuel */
      <div className="select is-fullwidth">
        <select
          name={field}
          value={newCar[field]}
          onChange={handleInputChange}
          style={{
            border: isFieldInvalid(field)
              ? "2px solid red"
              : "1px solid #605fc9",
            borderRadius: "12px",
          }}
        >
          <option value="">Select</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="electric">Electric</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
    ) : (
      /* NORMAL INPUT */
      <input
        className="input"
        type={
          ["year", "seats", "price_per_hour", "price_per_day", "price_per_km"].includes(field)
            ? "number"
            : "text"
        }
        name={field}
        value={newCar[field]}
        onChange={handleInputChange}
        style={{
          border: isFieldInvalid(field)
            ? "2px solid red"
            : "1px solid #605fc9",
          borderRadius: "12px",
        }}
      />
    )}
  </div>
))}

        {/* Upload new images */}
        <div className="field">
          <label className="label">Add New Images</label>
          <input
            type="file"
            multiple
            className="input"
            onChange={(e) => setCarImages(Array.from(e.target.files))}
          />
        </div>

        {/* Preview new images */}
        {carImages.length > 0 && (
          <div className="field">
            <p>Selected Images:</p>
            <ul>
              {carImages.map((image, index) => (
                <li key={index} style={{ display: "flex", marginBottom: "10px" }}>
                  <img
                    src={URL.createObjectURL(image)}
                    width="100"
                    style={{ marginRight: "10px" }}
                  />
                  <span>{image.name}</span>
                  <button
                    className="button is-danger is-light is-small"
                    onClick={() => handleRemoveNewCarImage(index)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Existing images */}
        {existingCarImages.length > 0 && (
          <div className="field">
            <p>Existing Images:</p>
            <ul>
              {existingCarImages.map((image) => (
                <li key={image.id} style={{ display: "flex", marginBottom: "10px" }}>
                  <img
                    src={`${API_URL}${image.url}`}
                    width="100"
                    style={{ marginRight: "10px" }}
                  />
                  <span style={{ flex: 1 }}>{`Image ID: ${image.id}`}</span>
                  <button
                    className="button is-danger is-light is-small"
                    onClick={() => handleRemoveExistingCarImage(currentCarId, image.id)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

                {errorMessage && (
              <div className="notification is-danger">
                <button className="delete" onClick={() => setErrorMessage("")}></button>
                {errorMessage}
              </div>
            )}

      </section>

      <footer className="modal-card-foot has-background-link-light" style={{ justifyContent: "center" }}>
        <button className="button" onClick={saveCar}>
          <i className="fas fa-check"></i>
        </button>
      </footer>

    </div>
  </div>
)}
    </>
  );
};

export default CarsManagement;