import React, {useContext, useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostImageGallery from "./PostImageGallery";
import CommentsSection from "./CommentsSection";
import {UserContext} from "../context/UserContext";

const PostDetail = () => {
  const { id } = useParams();  // Get the post ID from the URL
  const navigate = useNavigate();  // For navigating back to the explore page
  const [post, setPost] = useState(null);
  const [postImages, setPostImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [token, , username, userId,] = useContext(UserContext); // Get the token from context
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);



  const formatContent = (content) => {
  return content.replace(/(.{190})/g, "$1\n"); // Insert \n every 150 characters
};

 useEffect(() => {
    const fetchPostDetail = async () => {
        try {
            const response = await fetch(`http://localhost:8000/post/${id}`);
            if (!response.ok) throw new Error("Error fetching post details");
            const data = await response.json();
            setPost(data);
            setPostImages(data.images || []);

            // Check if post is favorited
            await checkIfFavorited();
            await checkFavoriteCount();
        } catch (error) {
            setErrorMessage("Could not fetch post details.");
        }
    };

    fetchPostDetail();
}, [id, token, userId]);


   const renderEditorJSContent = (data) => {
  // Parse content if it's a string
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data); // Parse stringified JSON
    } catch (error) {
      console.error("Error parsing content:", error);
      return <p>Error parsing content.</p>;
    }
  }

  if (!parsedData || !parsedData.blocks) {
    return <p>No content available.</p>;
  }

  return parsedData.blocks.map((block) => {
    switch (block.type) {
      case "header":
        return <h3 className="title is-4" style={{ marginTop: '10px'}} key={block.id}>{block.data.text}</h3>;
      case "paragraph":
        return <p key={block.id}>{block.data.text}</p>;
        case "list":
        // Check the style of the list: ordered or unordered
        const ListType = block.data.style === "ordered" ? "ol" : "ul";
        return (
          <ListType key={block.id} style={{ paddingLeft: '20px' }}>
            {block.data.items.map((item, index) => (
              <li key={index} style={{ listStyleType: 'none' }}>
                <span style={{marginRight: '10px'}}>
                  <strong>{block.data.style === "ordered" ? index + 1 + "." : "•"}</strong>
                </span>
                  {item.content}
              </li>
            ))}
          </ListType>
        );
        case "table":
        return (
          <table key={block.id} className="table is-bordered is-striped is-narrow is-hoverable" style={{ marginTop: '20px'}}>
            <thead>
              <tr>
                {block.data.content[0].map((header, index) => (
                  <th key={index}>{header.replace(/&nbsp;/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.data.content.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell.replace(/&nbsp;/g, ' ')}</td>
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
    if (!token) return; // Ensure user is logged in

    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    };

    try {
        // Fetch user's favorites
        const response = await fetch(`http://localhost:8000/users/${userId}/favorites`, requestOptions);
        if (!response.ok) throw new Error("Failed to load favorites");

        const favorites = await response.json();
        console.log("Favorites:", favorites); // Debugging

        // Check if the current post is favorited
        if (Array.isArray(favorites)) {
            setIsFavorited(favorites.some(fav => String(fav.id) === id));

        }
    } catch (error) {
        console.error("Error checking favorites:", error);
    }
};


const checkFavoriteCount = async () => {
    try {
      const response = await fetch(`http://localhost:8000/posts/${id}/favorites/count`);
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
        const response = await fetch(`http://localhost:8000/users/${userId}/post/${id}/favorites`, requestOptions);
        if (!response.ok) throw new Error("Could not update favorites");
        setIsFavorited(!isFavorited);
        checkFavoriteCount();
    } catch (error) {
        console.error(error);
    }
};



  // Handle go back action
     const handleGoBack = () => {
      navigate('/explore');
    };

  if (errorMessage) {
    return <p style={{ color: '#f14668' }}>{errorMessage}</p>;
  }

  if (!post) {
    return <p>Loading post...</p>;
  }


  return (
      <div style={{position: 'relative'}}>  {/* Make the parent container relative to position the button absolutely */}
          <button onClick={handleGoBack} className="button is-link">
              Back to Explore
          </button>

          <br/>
          <br/>

          <h1 className="title is-1">{post.title}</h1>
          <p><strong> Posted by: </strong> {post.user?.name} {post.user?.surname}</p>
          {/*<img src={avatarUrl} alt="User Avatar" style={{width: "50px", height: "50px", borderRadius: "50%"}}/>*/}
          <br/>
          <div style={{marginBottom: "20px", whiteSpace: "pre-line"}}>
              {/* Render the parsed content */}
              {post.content && renderEditorJSContent(post.content)}
          </div>
          <br/>
          <PostImageGallery postId={id}/>
          <br/>
          <div>
              <div className="tags">
                  {post.tags.map((tag, index) => (
                      <span key={index} className="tag is-link is-rounded">
                    {tag}
                </span>
                  ))}
              </div>
          </div>
          {post.user_id !== userId && (
              <button
                  onClick={toggleFavorite}
                  style={{
                      position: 'absolute',  // Position button absolutely
                      top: '20px',           // Adjust top distance from the top
                      right: '15px',         // Adjust right distance from the right
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                  }}
              >
                 <span className="icon">
                    <i className={isFavorited ? "fas fa-heart" : "far fa-heart"}
                       style={{color: isFavorited ? "red" : "gray", fontSize: "28px"}}></i>
                </span>
              </button>

          )}

          {post.user_id == userId && (
              <div style={{
                  position: 'absolute',  // Position button absolutely
                  top: '20px',           // Adjust top distance from the top
                  right: '15px',         // Adjust right distance from the right
                  background: 'none',
                  border: 'none',
              }}>
                  <p>Likes:</p>
              </div>
          )}
          <br/>
          <br/>
          <div style={{
              position: 'absolute',  // Position button absolutely
              top: '20px',          // Adjust top distance from the top
              right: '0px',         // Adjust right distance from the right
              background: 'none',
              border: 'none',
          }}>
              <p>{favoriteCount}</p>
          </div>
          <br/>
          <br/>

          <CommentsSection postId={id}/>

      </div>

  );
};

export default PostDetail;
