import React, { useEffect, useState, useCallback, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { Link } from "react-router-dom";

const API_URL = 'https://k548-esp-2.onrender.com';
const Explore = () => {
  const [posts, setPosts] = useState([]);  // Store all posts
  const [postImages, setPostImages] = useState({});  // Store images by postId
  const [errorMessage, setErrorMessage] = useState("");  // Handle errors
  const [token, , username, userId] = useContext(UserContext); // Get the token from context

  // For sorting and filtering
  const [sortOption, setSortOption] = useState("newest"); // Sorting state (newest/oldest)
  const [selectedTags, setSelectedTags] = useState([]); // Tags filter state
  const [selectedCategory, setSelectedCategory] = useState(""); // Category filter state

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;

  const fetchPosts = useCallback(async () => {
    try {
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      // Fetch posts from all users
      const response = await fetch(`${API_URL}/posts`, requestOptions);

      if (!response.ok) {
        throw new Error('Error fetching posts');
      } else {
        const data = await response.json();
        setPosts(data);

        // Create a map of postId to images
        const postImagesMap = {};
        data.forEach(post => {
          postImagesMap[post.id] = post.images || [];
        });

        setPostImages(postImagesMap);  // Store images by postId
      }
    } catch (error) {
      setErrorMessage('Could not fetch posts.');
    }
  }, [token]);

  useEffect(() => {
    fetchPosts(); // Fetch posts on component mount
  }, [fetchPosts]);

  // Handle sorting posts
  const sortPosts = (posts) => {
    const sortedPosts = [...posts];
    if (sortOption === "newest") {
      sortedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortOption === "oldest") {
      sortedPosts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    return sortedPosts;
  };

    // Handle category filtering
  const filterPostsByCategory = (posts) => {
    if (!selectedCategory) return posts; // No category selected, return all posts
    return posts.filter(post => post.category === selectedCategory);
  };

  // Apply sorting and filtering
  const filteredAndSortedPosts = filterPostsByCategory(sortPosts(posts));

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedPosts.length / itemsPerPage);
  const currentPosts = filteredAndSortedPosts.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div>
      <h2 className="title is-2">Explore</h2>

      {errorMessage && <p className="has-text-centered" style={{ color: '#f14668' }}>{errorMessage}</p>}

      {/* Sorting options using a dropdown */}
      <div className="is-centered" style={{marginBottom: '50px', marginRight: '20px'}}>
        <div className="select" style={{marginBottom: '20px', marginRight: '20px'}}>
          <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
        <div className="select">
          <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Environmental">Environmental</option>
            <option value="Social">Social</option>
            <option value="Economic">Economic</option>
          </select>
        </div>
      </div>


      {filteredAndSortedPosts.length === 0 ? (
          <p className="has-text-centered" style={{color: '#888', fontSize: '1.2em'}}>No posts available</p>
      ) : (
          <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {currentPosts.map((post) => (
              <div key={post.id} className="box"
                   style={{position: 'relative', maxHeight: '470px', border: '3px solid #00d1b2'}}>
                <p
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      fontSize: '0.9em',
                      color: 'black',
                    }}
                >
                  {new Date(post.created_at).toLocaleString()}
                </p>
                <br/>
                <h5 className="title is-5">{post.title}</h5>
                <div className="tags">
                  {post.tags.map((tag, index) => (
                      <span key={index} className="tag is-link is-rounded">{tag}</span>
                  ))}
                </div>

                <br/>
                {postImages[post.id] && postImages[post.id].length > 0 ? (
                    <figure
                        style={{
                          width: '100%',
                          height: '200px',
                          overflow: 'hidden',
                          margin: 0,
                        }}
                    >
                      <img
                          src={`${API_URL}${postImages[post.id][0].url}`}
                          alt={post.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                      />
                    </figure>
                ) : (
                    <div
                        style={{
                          width: '100%',
                          height: '200px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: '#f0f0f0',
                          color: '#888',
                        }}
                    >
                      No Image Available
                    </div>
                )}
                <br/>
                <p className="text-is-1" style={{fontSize: "15px"}}>
                  <i className="fas fa-user mr-1"></i> {/* User Icon */}
                  <strong>{post.user?.username}</strong>
                </p>
                <br/>
                <p
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      fontSize: '0.9em',
                      color: 'black',
                    }}
                >
                  <Link to={`/post/${post.id}`} className="button is-link is-outlined">
                    View Details
                  </Link>
                </p>
                <br/>

              </div>
          ))}

        </div>
      )}
      {/* Pagination Controls */}
      <div className="pagination" style={{
        display: 'flex',
        justifyContent: 'center',  // Center pagination controls
        alignItems: 'center',  // Vertically align the buttons
        marginTop: '20px',
        gap: '10px'  // Optional: adds space between the arrows and page numbers
}}>
    {/* Left Arrow Button */}
    <button
      className="button is-primary"
      onClick={() => setCurrentPage(currentPage - 1)}
      disabled={currentPage === 0}
      style={{ padding: '10px 20px' }}
    >
        &lt;
    </button>

    {/* Page Number */}
    <span style={{
      alignSelf: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold',
      margin: '0 10px'
    }}>
        {currentPage + 1} / {totalPages}
    </span>

    {/* Right Arrow Button */}
    <button
      className="button is-primary"
      onClick={() => setCurrentPage(currentPage + 1)}
      disabled={currentPage >= totalPages - 1}
      style={{ padding: '10px 20px' }}
    >
        &gt;
    </button>
</div>
    </div>

  );
};

export default Explore;
