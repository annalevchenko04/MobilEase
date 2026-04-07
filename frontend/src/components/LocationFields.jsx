// npm install country-state-city react-select

import { useState } from "react";
import Select from "react-select";
import { Country, City } from "country-state-city";

const selectStyles = {
  control: (base) => ({
    ...base,
    border: "1px solid #605fc9",
    borderRadius: "12px",
    boxShadow: "none",
    "&:hover": { borderColor: "#605fc9" },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#f3f2ff" : "#fff",
    color: "#222",
    cursor: "pointer",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(96,95,201,0.15)",
    border: "1px solid #605fc9",
  }),
};

export default function LocationFields({ newPost, handleInputChange }) {
  const allCountries = Country.getAllCountries().map((c) => ({
    label: c.name,
    value: c.isoCode,
  }));

  const [fromCountry, setFromCountry] = useState(null);
  const [toCountry, setToCountry] = useState(null);

  const getCities = (isoCode) =>
    City.getCitiesOfCountry(isoCode).map((c) => ({
      label: c.name,
      value: c.name,
    }));

  const fire = (name, value) =>
    handleInputChange({ target: { name, value } });

  return (
    <>
      {/* FROM */}
      <div className="field">
        <label className="label">From Country</label>
        <Select
          options={allCountries}
          styles={selectStyles}
          placeholder="e.g., Lithuania"
          value={fromCountry}
          onChange={(opt) => {
            setFromCountry(opt);
            fire("from_country", opt?.label || "");
            fire("from_city", "");
          }}
          isClearable
        />
      </div>

      <div className="field">
        <label className="label">From City</label>
        <Select
          options={fromCountry ? getCities(fromCountry.value) : []}
          styles={selectStyles}
          placeholder={fromCountry ? "Search city..." : "Select a country first"}
          isDisabled={!fromCountry}
          onChange={(opt) => fire("from_city", opt?.value || "")}
          isClearable
        />
      </div>

      {/* TO */}
      <div className="field">
        <label className="label">To Country</label>
        <Select
          options={allCountries}
          styles={selectStyles}
          placeholder="e.g., Germany"
          value={toCountry}
          onChange={(opt) => {
            setToCountry(opt);
            fire("to_country", opt?.label || "");
            fire("to_city", "");
          }}
          isClearable
        />
      </div>

      <div className="field">
        <label className="label">To City</label>
        <Select
          options={toCountry ? getCities(toCountry.value) : []}
          styles={selectStyles}
          placeholder={toCountry ? "Search city..." : "Select a country first"}
          isDisabled={!toCountry}
          onChange={(opt) => fire("to_city", opt?.value || "")}
          isClearable
        />
      </div>

      {/* Rest of fields */}
      <div className="field">
        <label className="label">Distance (km)</label>
        <div className="control">
          <input
            className="input"
            type="number"
            name="distance_km"
            placeholder="e.g., 102"
            value={newPost.distance_km}
            onChange={handleInputChange}
            style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
          />
        </div>
      </div>

      <div className="field">
        <label className="label">Estimated Duration (hours)</label>
        <div className="control">
          <input
            className="input"
            type="number"
            name="estimated_duration"
            placeholder="e.g., 90"
            value={newPost.estimated_duration}
            onChange={handleInputChange}
            style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
          />
        </div>
      </div>

      <div className="field">
        <label className="label">Price (€)</label>
        <div className="control">
          <input
            className="input"
            type="number"
            name="price"
            placeholder="e.g., 12.50"
            value={newPost.price}
            onChange={handleInputChange}
            style={{ border: "1px solid #605fc9", borderRadius: "12px" }}
          />
        </div>
      </div>
    </>
  );
}
