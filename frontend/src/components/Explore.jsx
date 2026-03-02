import React, { useEffect, useState, useCallback, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { Link } from "react-router-dom";
import API_URL from "../config";

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [postImages, setPostImages] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const [token, , username, userId] = useContext(UserContext);

  // Sorting & filtering
  const [sortOption, setSortOption] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Route search filters
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error fetching posts");

      const data = await response.json();
      setPosts(data);

      const postImagesMap = {};
      data.forEach((post) => {
        postImagesMap[post.id] = post.images || [];
      });

      setPostImages(postImagesMap);
    } catch (error) {
      setErrorMessage("Could not fetch posts.");
    }
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Sorting
  const sortPosts = (posts) => {
    const sorted = [...posts];
    if (sortOption === "newest") {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    return sorted;
  };

  // Category filter
  const filterByCategory = (posts) => {
    if (!selectedCategory) return posts;
    return posts.filter((post) => post.category === selectedCategory);
  };

  // Route search filter
  const filterByRoute = (posts) => {
    return posts.filter((post) => {
      const matchFrom = fromCity
        ? post.from_city?.toLowerCase().includes(fromCity.toLowerCase())
        : true;

      const matchTo = toCity
        ? post.to_city?.toLowerCase().includes(toCity.toLowerCase())
        : true;

      const matchPrice = maxPrice
        ? post.price !== null && post.price <= parseFloat(maxPrice)
        : true;

      return matchFrom && matchTo && matchPrice;
    });
  };

  // Combine filters
  const filteredAndSortedPosts = filterByRoute(
    filterByCategory(sortPosts(posts))
  );

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPosts.length / itemsPerPage);
  const currentPosts = filteredAndSortedPosts.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div>
      <h2 className="title is-2">Explore Routes</h2>

      {errorMessage && (
        <p className="has-text-centered" style={{ color: "#f14668" }}>
          {errorMessage}
        </p>
      )}

      {/* SEARCH BAR */}
      <div className="box" style={{ marginBottom: "30px", border: "3px solid #605fc9" }}>
        <h3 className="title is-4">Search</h3>

        <div className="columns">

          <div className="column">
            <label className="label">From</label>
            <input
              className="input"
              type="text"
              placeholder="City of departure"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
            />
          </div>

          <div className="column">
            <label className="label">To</label>
            <input
              className="input"
              type="text"
              placeholder="Destination city"
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
            />
          </div>

          <div className="column">
            <label className="label">Max Price (€)</label>
            <input
              className="input"
              type="number"
              placeholder="Any"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* SORTING + CATEGORY */}
      <div className="is-centered" style={{ marginBottom: "50px" }}>
        <div className="select" style={{ marginRight: "20px" }}>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        {/*<div className="select">*/}
        {/*  <select*/}
        {/*    value={selectedCategory}*/}
        {/*    onChange={(e) => setSelectedCategory(e.target.value)}*/}
        {/*  >*/}
        {/*    <option value="">All Categories</option>*/}
        {/*    <option value="Environmental">Environmental</option>*/}
        {/*    <option value="Social">Social</option>*/}
        {/*    <option value="Economic">Economic</option>*/}
        {/*  </select>*/}
        {/*</div>*/}
      </div>

      {/* POSTS GRID */}
      {filteredAndSortedPosts.length === 0 ? (
        <p className="has-text-centered" style={{ color: "#888", fontSize: "1.2em" }}>
          No routes found
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {currentPosts.map((post) => (
            <div
              key={post.id}
              className="box"
              style={{ position: "relative", maxHeight: "470px", border: "3px solid #605fc9" }}
            >
              <p
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  fontSize: "0.9em",
                  color: "black",
                }}
              >
                {new Date(post.created_at).toLocaleString()}
              </p>

              <h5 className="title is-5">{post.title}</h5>

              <div className="tags">
                {post.tags?.map((tag, index) => (
                  <span key={index} className="tag is-link is-rounded">
                    {tag}
                  </span>
                ))}
              </div>

              {/* IMAGE */}
              {postImages[post.id]?.length > 0 ? (
                <figure style={{ width: "100%", height: "200px", overflow: "hidden", margin: 0 }}>
                  <img
                    src={`${API_URL}${postImages[post.id][0].url}`}
                    alt={post.title}
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

              <p style={{ fontSize: "15px", marginTop: "10px" }}>
                <i className="fas fa-user mr-1"></i>
                <strong>{post.user?.username}</strong>
              </p>

              <p style={{ marginTop: "10px" }}>
                <strong>From:</strong> {post.from_city}, {post.from_country}
                <br />
                <strong>To:</strong> {post.to_city}, {post.to_country}
                <br />
                <strong>Price:</strong> €{post.price}
              </p>

              <p
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                }}
              >
                <Link to={`/post/${post.id}`} className="button is-link is-outlined">
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

export default Explore;