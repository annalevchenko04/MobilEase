import React, {useContext, useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostImageGallery from "./PostImageGallery";
import CommentsSection from "./CommentsSection";
import {UserContext} from "../context/UserContext";
import API_URL from "../config";

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [postImages, setPostImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [token, , username, userId] = useContext(UserContext);

  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const formatContent = (content) => {
    return content.replace(/(.{190})/g, "$1\n");
  };

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        const response = await fetch(`${API_URL}/post/${id}`);
        if (!response.ok) throw new Error("Error fetching post details");

        const data = await response.json();
        setPost(data);
        setPostImages(data.images || []);

        await checkIfFavorited();
        await checkFavoriteCount();
      } catch (error) {
        setErrorMessage("Could not fetch post details.");
      }
    };

    fetchPostDetail();
  }, [id, token, userId]);

  const renderEditorJSContent = (data) => {
    let parsedData = data;
    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (error) {
        return <p>Error parsing content.</p>;
      }
    }

    if (!parsedData || !parsedData.blocks) {
      return <p>No content available.</p>;
    }

    return parsedData.blocks.map((block) => {
      switch (block.type) {
        case "header":
          return (
            <h3 className="title is-4" key={block.id} style={{ marginTop: "10px" }}>
              {block.data.text}
            </h3>
          );
        case "paragraph":
          return <p key={block.id}>{block.data.text}</p>;
        case "list":
          const ListType = block.data.style === "ordered" ? "ol" : "ul";
          return (
            <ListType key={block.id} style={{ paddingLeft: "20px" }}>
              {block.data.items.map((item, index) => (
                <li key={index} style={{ listStyleType: "none" }}>
                  <span style={{ marginRight: "10px" }}>
                    <strong>
                      {block.data.style === "ordered" ? index + 1 + "." : "•"}
                    </strong>
                  </span>
                  {item.content}
                </li>
              ))}
            </ListType>
          );
        case "table":
          return (
            <table
              key={block.id}
              className="table is-bordered is-striped is-narrow is-hoverable"
              style={{ marginTop: "20px" }}
            >
              <thead>
                <tr>
                  {block.data.content[0].map((header, index) => (
                    <th key={index}>{header.replace(/&nbsp;/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.data.content.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell.replace(/&nbsp;/g, " ")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        default:
          return null;
      }
    });
  };

  const checkIfFavorited = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/users/${userId}/favorites`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load favorites");

      const favorites = await response.json();

      if (Array.isArray(favorites)) {
        setIsFavorited(favorites.some((fav) => String(fav.id) === id));
      }
    } catch (error) {
      console.error("Error checking favorites:", error);
    }
  };

  const checkFavoriteCount = async () => {
    try {
      const response = await fetch(`${API_URL}/posts/${id}/favorites/count`);
      if (!response.ok) throw new Error("Failed to fetch favorite count");

      const data = await response.json();
      setFavoriteCount(data.favorite_count);
    } catch (error) {
      console.error("Error fetching favorite count:", error);
    }
  };

  const toggleFavorite = async () => {
    const requestOptions = {
      method: isFavorited ? "DELETE" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const response = await fetch(
        `${API_URL}/users/${userId}/post/${id}/favorites`,
        requestOptions
      );

      if (!response.ok) throw new Error("Could not update favorites");

      setIsFavorited(!isFavorited);
      checkFavoriteCount();
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoBack = () => {
    navigate("/explore");
  };

  if (errorMessage) {
    return <p style={{ color: "#f14668" }}>{errorMessage}</p>;
  }

  if (!post) {
    return <p>Loading post...</p>;
  }

  return (
    <div style={{ position: "relative" }}>
      <button onClick={handleGoBack} className="button is-link">
        Back to Explore Routes
      </button>

      <br />
      <br />

      <h1 className="title is-1">{post.title}</h1>
      <p>
        <strong> Posted by: </strong> {post.user?.name} {post.user?.surname}
      </p>

      <br />

{/* ROUTE INFO + IMAGE INSIDE ONE BOX */}
<div
  className="box"
  style={{
    border: "3px solid #605fc9",
    borderRadius: "12px",
    padding: "25px",
    background: "#f9f9ff",
    marginBottom: "30px"
  }}
>

  <div className="columns is-vcentered">

    {/* LEFT — ROUTE INFO (2/3) */}
    <div className="column is-two-thirds">
      <h2 className="title is-4" style={{ color: "#605fc9" }}>
        Route Information
      </h2>

      <div style={{ fontSize: "18px", lineHeight: "1.8" }}>
        <p><strong>From:</strong> {post.from_city}, {post.from_country}</p>
        <p><strong>To:</strong> {post.to_city}, {post.to_country}</p>

        <br />

        <p>
          <i className="fas fa-road" style={{ marginRight: "8px", color: "#605fc9" }}></i>
          <strong>Distance:</strong> {post.distance_km} km
        </p>

        <p>
          <i className="fas fa-clock" style={{ marginRight: "8px", color: "#605fc9" }}></i>
          <strong>Estimated Duration:</strong> {post.estimated_duration} hours
        </p>

        <p>
          <i className="fas fa-euro-sign" style={{ marginRight: "8px", color: "#605fc9" }}></i>
          <strong>Price:</strong> €{post.price}
        </p>
      </div>
<br/>
      <button
  onClick={() => navigate("/schedule", { state: { eventName: post.title } })}
  className="button is-primary is-medium"
  style={{
    backgroundColor: "#605fc9",
    borderColor: "#605fc9",
    color: "white",
    width: "100%",
    borderRadius: "10px",
    fontSize: "18px"
  }}
>
  <i className="fas fa-ticket-alt" style={{ marginRight: "10px" }}></i>
  Book Now
</button>

    </div>

    {/* RIGHT — IMAGE (1/3) */}
    <div className="column is-one-third">
      {postImages.length > 0 ? (
        <figure
          style={{
            width: "100%",
            height: "250px",
            overflow: "hidden",
            borderRadius: "12px"
          }}
        >
          <img
            src={`${API_URL}${postImages[0].url}`}
            alt="Route"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        </figure>
      ) : (
        <div
          style={{
            width: "100%",
            height: "250px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f0f0f0",
            borderRadius: "12px"
          }}
        >
          No Image Available
        </div>
      )}
    </div>

  </div>
</div>

      {/* OPTIONAL CONTENT */}
      {post.content && (
        <div style={{ marginBottom: "20px", whiteSpace: "pre-line" }}>
          {renderEditorJSContent(post.content)}
        </div>
      )}

      <div className="tags">
        {post.tags.map((tag, index) => (
          <span key={index} className="tag is-link is-rounded">
            {tag}
          </span>
        ))}
      </div>

      {/* FAVORITE BUTTON */}
      {post.user_id !== userId && (
        <button
          onClick={toggleFavorite}
          style={{
            position: "absolute",
            top: "20px",
            right: "15px",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span className="icon">
            <i
              className={isFavorited ? "fas fa-heart" : "far fa-heart"}
              style={{
                color: isFavorited ? "red" : "gray",
                fontSize: "28px",
              }}
            ></i>
          </span>
        </button>
      )}

      {/* FAVORITE COUNT */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "0px",
          background: "none",
          border: "none",
        }}
      >
        <p>{favoriteCount}</p>
      </div>

      <br />
      <br />

      <CommentsSection postId={id} />
    </div>
  );
};

export default PostDetail;