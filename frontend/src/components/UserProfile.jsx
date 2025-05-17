import React, { useEffect, useState, useContext, useCallback,  useRef } from "react";
import { UserContext } from "../context/UserContext";
import { Link } from "react-router-dom";
import EditorComponent from "./EditorComponent";

const UserProfile = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [error, setError] = useState(null);
    const [token, userRole, username, userId,] = useContext(UserContext); // Get the token from context
    const [avatarFile, setAvatarFile] = useState(null); // Holds the selected file (before upload)
    const [avatarUrl, setAvatarUrl] = useState(null);    // Holds the uploaded avatar URL
    const [avatarId, setAvatarId] = useState(null); // Use this to store avatarId

    const [posts, setPosts] = useState([]);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        category: '',
        tags: [],});
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false); // State to toggle creating new plan
    const [images, setImages] = useState([]); // State for image
    const [existingImages, setExistingImages] = useState([]);
    const [newTag, setNewTag] = useState("");  // To manage the input field for tags
    const [tags, setTags] = useState([]);
    const [postImages, setPostImages] = useState({});
    const [isAvatarUploaded, setIsAvatarUploaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [badges, setBadges] = useState([]);


    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };
        return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
    };

    // Fetch user profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const requestOptions = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`, // Include token for authentication
                    },
                };
                const response = await fetch(`http://localhost:8000/user/${username}`, requestOptions);

                if (!response.ok) {
                    throw new Error("Failed to fetch user profile.");
                }

                const data = await response.json();
                setUserProfile(data);
            } catch (error) {
                setError(error.message);
            }
        };
        const fetchUserBadges = async () => {
        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await fetch(`http://localhost:8000/users/${userId}/badges`, requestOptions);
            if (!response.ok) throw new Error("Failed to fetch badges.");
            const data = await response.json();
            setBadges(data); // Store badges in state
        } catch (error) {
            setError(error.message);
        }
    };

    if (token && username) {
        fetchUserProfile();
        fetchUserBadges(); // Fetch badges when profile loads
    }
    }, [token, username]); // Include token and username as dependencies


 const fetchPosts = useCallback(async () => {
  try {
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await fetch(`http://localhost:8000/users/${userId}/myposts`, requestOptions);
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

      setPostImages(postImagesMap);  // Store images by postId // Fix for images
    }

  } catch (error) {
    setErrorMessage('Could not fetch posts.');
  }
}, [token, userId]);

useEffect(() => {
  if (userId) {
    fetchPosts();
  }
}, [userId, fetchPosts]);


  const fetchUserAvatar = async () => {
    try {
        const response = await fetch(`http://localhost:8000/users/${userId}/avatar`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch avatar.");
        }

        const data = await response.json();

        // Prepend the base URL to the relative path
        const fullAvatarUrl = `http://localhost:8000${data.url}`;
        setAvatarUrl(fullAvatarUrl);
        setAvatarId(data.id);
    } catch (error) {
        console.error("Error fetching avatar:", error);
    }
};

useEffect(() => {
    if (userId && token) {
        // Only fetch the avatar if userId and token are available
        fetchUserAvatar().then(() => {}).catch(error => console.error("Error fetching avatar:", error));
    }
}, [userId, token]);  // Ensure this effect runs when userId or token changes


    const deleteAvatar = async () => {
    if (!userId || !token) return;

    try {
        const response = await fetch(`http://localhost:8000/users/${userId}/avatar/${avatarId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to delete avatar.");
        }

        const data = await response.json();
        console.log(data.message); // "Avatar deleted successfully"

        // Clear the avatar URL from state
        setAvatarUrl(null);
    } catch (error) {
        console.error("Error deleting avatar:", error);
    }
};


// Set existing images for the current post when editing
useEffect(() => {
    if (isEditing && currentPostId) {
        setTimeout(() => {
            const currentPost = posts.find(post => post.id === currentPostId);
            if (currentPost) {
                setExistingImages(currentPost.images || []);
                setNewPost({
                    title: currentPost.title,
                    content: currentPost.content,
                    category: currentPost.category,
                    tags: currentPost.tags || [],
                });
            }
        }, 500); // Wait 500ms before updating state
    }
}, [isEditing, currentPostId, posts]);  // <--- FIXED SYNTAX HERE







  // Function to handle removing newly selected images
  const handleRemoveNewImage = (indexToRemove) => {
    setImages((prevImages) => prevImages.filter((_, index) => index !== indexToRemove));
  };

  // Function to handle removing existing images
const handleRemoveExistingImage = async (postId, imageId) => {
  try {
    const response = await fetch(`http://localhost:8000/users/${userId}/post/${currentPostId}/image/${imageId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

   setExistingImages(prevImages => prevImages.filter(image => image.id !== imageId));
  } catch (error) {
    console.error("Error removing image:", error);
  }
};


const uploadImages = async (files, userId, postId) => {
  const uploadPromises = files.map(file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result;  // Base64 data
        try {
          const formData = new FormData();
          formData.append("image_data", base64data);  // Send base64 as form data

          const response = await fetch(`http://localhost:8000/users/${userId}/post/${postId}/image`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,  // Use FormData for the request body
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
    // Wait for all images to upload
    const uploadedImages = await Promise.all(uploadPromises);

    // Update state with the newly uploaded images
    setExistingImages(prevImages => [...prevImages, ...uploadedImages]);

  } catch (error) {
    console.error('Error uploading images:', error);
  }
};


const uploadAvatars = async (file, userId) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64data = reader.result; // Base64 data
      try {
        const formData = new FormData();
        formData.append("avatar_data", base64data); // Send base64 as form data

        const response = await fetch(`http://localhost:8000/users/${userId}/avatar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData, // Use FormData for the request body
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const avatarResponse = await response.json();
        resolve(avatarResponse); // Resolve with the response
      } catch (error) {
        reject(error); // Reject if there's an error
      }
    };

    reader.readAsDataURL(file); // Read the file as base64
  });
};


// Handle file selection for avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];  // Get the first file
    if (file) {
      setAvatarFile(file);  // Set the selected file in state
    }
  };

  // Submit the avatar to the backend
  const handleAvatarUpload = async () => {
    try {
        // Upload the avatar only if avatarFile is not null
        if (avatarFile) {
            const uploadedAvatar = await uploadAvatars(avatarFile, userProfile.id);
            const fullAvatarUrl = `http://localhost:8000${uploadedAvatar.url}`;
            setAvatarUrl(fullAvatarUrl); // Update avatarUrl with the response URL
            setIsAvatarUploaded(true); // Mark the avatar as uploaded
            setSuccessMessage('Avatar updated successfully!'); // Show success message
            setTimeout(() => setSuccessMessage(''), 3000); // Hide the success message after 3 seconds
        }
    } catch (error) {
        console.error("Error uploading avatar:", error);
    }
};


  // Handle input changes for new plan
  const handleInputChange = (e) => {
  const { name, value } = e.target;

  if (name === "tags") {
    setNewPost((prev) => ({
      ...prev,
      tags: value.split(",").map(tag => tag.trim()), // Convert string to array
    }));
  } else {
    setNewPost((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
};

const handleEditorChange = useCallback((content) => {
    setTimeout(() => {
        try {
            // Instead of saving as plain text, save the full JSON content
            setNewPost((prev) => ({
                ...prev,
                content: content, // Save the JSON directly, without parsing to plain text
            }));
        } catch (error) {
            console.error("Error saving editor content:", error);
        }
    }, 500); // Wait 500ms before updating state
}, []);


  // Create or update a membership plan
  const savePost = async () => {
    if (!newPost.title.trim()) {
        setErrorMessage("Title is required.");
        return;
      }

      if (!newPost.content.trim()) {
        setErrorMessage("Content is required.");
        return;
      }

      if (!newPost.category) {
        setErrorMessage("Category is required.");
        return;
      }

      if (tags.length === 0) {
        setErrorMessage("At least one tag is required.");
        return;
      }
    try {
      const requestOptions = {
        method: isEditing ? 'PUT' : 'POST', // Use PUT if editing, otherwise POST
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Include token for authentication
        },
       body: JSON.stringify({
        ...newPost,
        tags: tags || [],
      }),
      };
      const url = isEditing ? `http://localhost:8000/users/${userId}/post/${currentPostId}` : `http://localhost:8000/users/${userId}/post`;
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(isEditing ? 'Error updating plan' : 'Error creating plan');
      }
      const data = await response.json();
      const postId = data.id;

      // Now upload the image if one is selected
       if (images.length > 0) {
        await uploadImages(images, userId, postId); // Upload multiple images
      }

    // Update post images after creating the post
    setPostImages(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), ...images] // Add new images for this post
    }));


       await fetchPosts();

      if (isEditing) {
        // Update existing plan in state
        setPosts(posts.map(post => (post.id === currentPostId ? data : post)));
        setIsEditing(false); // Reset editing state
      } else {
        // Add new plan to state
        setPosts([...posts, data]);
      }

      setImages([]);
      setSuccessMessage(isEditing ? 'Post updated successfully!' : 'Post created successfully!'); // Set success message
      setTimeout(() => setSuccessMessage(''), 3000);

     setNewPost({
      title: '',
      content: '',
      category: '',
      tags: [],
    });
      setTags([]);


      setIsCreating(false);
    } catch (error) {
      setErrorMessage(isEditing ? 'Could not update post.' : 'Could not create post.'); // Set error message
    }
    await fetchPosts();
  };


   // Open the modal and set the post to delete
  const openDeleteModal = (postId) => {
    setPostToDelete(postId);
    setIsModalOpen(true);
  };

  // Close the modal
  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setPostToDelete(null);
  };

  // Handle post deletion after confirmation
  const confirmDelete = () => {
    if (postToDelete) {
      deletePost(postToDelete);
    }
    closeDeleteModal();
  };

  // Delete a membership plan
  const deletePost = async (id) => {
    try {
      const requestOptions = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Include token for authentication
        },
      };
      const response = await fetch(`http://localhost:8000/users/${userId}/post/${id}`, requestOptions);
      if (!response.ok) {
        throw new Error('Error deleting plan');
      }
      setPosts(posts.filter((post) => post.id !== id)); // Remove deleted plan from state
    } catch (error) {
      setErrorMessage('Could not delete post.'); // Set error message
    }
  };

  // Edit a membership plan
  const editPost = (post) => {
    setTags(Array.isArray(post.tags) ? post.tags : []);
    setIsEditing(true);
    setCurrentPostId(post.id);
    setIsCreating(false); // Close creation state if open
  };

const handleTagInput = (e) => {
  if (e.key === "Enter" && newTag.trim() !== "") {
    e.preventDefault();
    setTags([...tags, newTag.trim()]);
    setNewTag("");
  }
};

const handleRemoveTag = (tag) => {
  setTags((prevTags) => prevTags.filter((item) => item !== tag));
};


    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!userProfile) {
        return <div className="loading">Loading...</div>;
    }


    return (
        <div className="app-container">
            <div className="profile-card">
                <h2 className="title is-2">My Profile</h2>
                <div className="profile-details">

                    {avatarFile || avatarUrl ? (
                        <figure style={{
                            width: '250px',
                            height: '250px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            margin: 'auto',
                            border: '2px solid #00d1b2',
                        }}>
                            <img
                                src={avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl}
                                alt="User Avatar"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                        </figure>
                    ) : (
                        <div style={{
                            width: '200px',
                            height: '200px',
                            borderRadius: '50%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#f0f0f0',
                            color: '#888',
                            margin: 'auto',
                            fontSize: '14px'
                        }}>
                            No Avatar
                        </div>
                    )}
                    <div className="field" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>

                        {!avatarUrl && !isAvatarUploaded && (
                            <div className="field" style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: '15px'
                            }}>
                                <label className="file-label" style={{marginRight: '15px'}}>
                                    <input
                                        className="file-input"
                                        type="file"
                                        name="avatar"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                    <span className="file-cta">
                                    <span className="file-icon">
                                        <i className="fas fa-upload"></i>
                                    </span>
                                    <span className="file-label">Click to upload an avatar</span>
                                </span>
                                </label>

                                <button className="button is-primary" onClick={handleAvatarUpload}>
                                    <i className="fas fa-save"></i>
                                </button>
                            </div>
                        )}

                    </div>

                    {avatarUrl && avatarId && (
                        <div className="field" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <button className="button is-danger is-light is-small"
                                    style={{width: '30px', height: '30px', marginLeft: '10px'}}
                                    onClick={deleteAvatar}>
                                <i className="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    )}

                    <br/>
                    <p className="text-gray-400" style={{fontSize: "20px"}}>
                        <i className="fas fa-user mr-2"></i> {/* User Icon */}
                        <strong>Name:</strong> {userProfile.name} {userProfile.surname}
                    </p>
                    <p className="text-gray-400" style={{fontSize: "20px"}}>
                        <i className="fas fa-user-circle mr-2"></i> {/* Username Icon */}
                        <strong>Username:</strong> {userProfile.username} 
                    </p>
                    <p className="text-gray-400" style={{fontSize: "20px"}}>
                        <i className="fas fa-birthday-cake mr-2"></i> {/* Age Icon */}
                        <strong>Age:</strong> {userProfile.age}
                    </p>
                    <p className="text-gray-400" style={{fontSize: "20px"}}>
                        <i className="fas fa-venus-mars mr-1"></i> {/* Gender Icon */}
                        <strong>Gender:</strong> {userProfile.gender}
                    </p>
                    <p className="text-gray-400" style={{fontSize: "20px"}}>
                        <i className="fas fa-phone-alt mr-2"></i> {/* Phone Icon */}
                        <strong>Phone:</strong> {userProfile.phone}
                    </p>
                    <p className="text-gray-400" style={{fontSize: "20px"}}>
                        <i className="fas fa-envelope mr-2"></i> {/* Email Icon */}
                        <strong>Email:</strong> {userProfile.email}
                    </p>

                    {userProfile.company && (
                        <p className="text-gray-400" style={{fontSize: "20px"}}>
                            <i className="fas fa-briefcase mr-2"></i>
                            <strong>Company:</strong> {userProfile.company.name} ({userProfile.role})
                        </p>
                    )}
                </div>
            </div>
            <br/>
            <br/>

            <div className="profile-badges">
                <h3 className="title is-large">My Badges</h3>
                {badges.length > 0 ? (
                    <div className="badges-container">
                    {badges.map((badge) => (
                        <div key={badge.id} className="badge">
                            {badge.id === 1 ? (
                                <img
                                  src="http://localhost:8000/images/ESP_badge_1.png"  // Image for badge id 1
                                  alt={badge.name}
                                  className="badge-image"
                                />
                              ) : badge.id === 2 ? (
                                <img
                                  src="http://localhost:8000/images/ESP_badge_2.png"  // Image for badge id 2
                                  alt={badge.name}
                                  className="badge-image"
                                />
                              ) : badge.id === 3 ? (
                                <img
                                  src="http://localhost:8000/images/ESP_badge_3.png"  // Image for badge id 3
                                  alt={badge.name}
                                  className="badge-image"
                                />
                              )
                                : badge.id === 4 ? (
                                <img
                                  src="http://localhost:8000/images/ESP_badge_4.png"  // Image for badge id 4
                                  alt={badge.name}
                                  className="badge-image"
                                />
                              )
                                    : badge.id === 5 ? (
                                <img
                                  src="http://localhost:8000/images/ESP_badge_5.png"  // Image for badge id 5
                                  alt={badge.name}
                                  className="badge-image"
                                />
                              )
                                : null}
                            <div className="badge-info">  {/* Wrapper to group name and description */}
                                <strong>{badge.name}</strong>
                                <br/>
                                {badge.description}
                            </div>
                        </div>
                    ))}
                </div>
                ) : (
                    <p>No badges earned yet.</p>
                )}

            </div>
            <br/>
            {userRole !== "admin" && (
            <div className="has-text-centered">
                <button
                    className="button is-primary is-outlined is-medium"
                    style={{
                        borderWidth: '3px', // Increase border thickness
                    }}
                    onClick={() => {
                        setIsCreating(!isCreating);
                        setIsEditing(false); // Ensure editing mode is off
                        setNewPost({title: '', content: '', category: '', tags: ''});
                        setExistingImages([]);
                        setTags([]);
                    }}
                >
                    {isCreating ? <i className="fas fa-times"></i> : "Create Post"}
                </button>
            </div>
            )}


            <br/>
            <br/>

            {isCreating && (
                <div className="box" style={{border: '3px solid #00d1b2'}}>
                    <h3 className="title is-primary">Create a New Post</h3>
                    {errorMessage && (
                        <div className="notification is-danger">
                            <button className="delete" onClick={() => setErrorMessage('')}></button>
                            {errorMessage}
                        </div>
                    )}

                    <div className="field">
                        <label className="label">
                            Title <span style={{color: 'red'}}>*</span>
                        </label>
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                name="title"
                                placeholder="Title"
                                value={newPost.title}
                                onChange={handleInputChange}
                                style={{
                                    border: '1px solid #00d1b2',
                                    borderRadius: '12px'
                                }}
                            />
                        </div>
                    </div>

                    {/*<div className="field">*/}
                    {/*    <label className="label">Content <span style={{color: 'red'}}>*</span></label>*/}
                    {/*    <div className="control">*/}
                    {/*        <textarea className="textarea" name="content" placeholder="Content" value={newPost.content}*/}
                    {/*                  onChange={handleInputChange} style={{*/}
                    {/*            border: '1px solid #00d1b2',*/}
                    {/*            borderRadius: '12px'*/}
                    {/*        }}></textarea>*/}
                    {/*    </div>*/}
                    {/*</div>*/}


                    <div className="field">
                        <label className="label">
                            Content <span style={{color: "red"}}>*</span>
                        </label>
                        <div className="control">
                            <EditorComponent onChange={handleEditorChange}/>
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">
                            Category <span style={{color: 'red'}}>*</span>
                        </label>
                        <div className="control">
                            <div className="select">
                                <select
                                    name="category"
                                    value={newPost.category}
                                    onChange={handleInputChange}
                                    style={{border: '1px solid #00d1b2', borderRadius: '12px'}}
                                >
                                    <option value="">Select</option>
                                    <option value="Environmental">Environmental</option>
                                    <option value="Social">Social</option>
                                    <option value="Economic">Economic</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">
                            Tags <span style={{color: 'red'}}>*</span>
                        </label>
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                name="tags"
                                placeholder="Enter tags with #"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)} // Update input state
                                onKeyDown={handleTagInput} // Add tag when 'Enter' is pressed
                                style={{
                                    border: '1px solid #00d1b2',
                                    borderRadius: '12px',
                                }}
                            />
                        </div>
                    </div>

                    <div className="field">
                        <div className="tags">
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="tag is-link is-rounded"
                                    style={{
                                        marginRight: "5px",
                                        cursor: "pointer",  // Allow user to click to remove
                                    }}
                                    onClick={() => handleRemoveTag(tag)}  // Remove tag when clicked
                                >
                                     {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">Image</label>
                        <div className="control">
                            <input
                                type="file"
                                className="input"
                                onChange={(e) => setImages(Array.from(e.target.files))}
                                multiple
                                style={{
                                    border: '1px solid #00d1b2',
                                    borderRadius: '12px'
                                }}
                            />
                        </div>
                    </div>
                    {/* Newly Selected Images */}
                    {images.length > 0 && (
                        <div className="field">
                            <p>Selected Images:</p>
                            <ul>
                                {images.map((image, index) => (
                                    <li key={index}
                                        style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                                        <img
                                            src={URL.createObjectURL(image)}  // Use URL.createObjectURL for local file reference
                                            alt={`Selected ${index}`}
                                            width="100"
                                            style={{marginRight: '10px'}}  // Add space between image and button
                                        />
                                        <span>{image.name}</span>
                                        <button
                                            className="button is-danger is-light is-small"
                                            style={{width: '30px', height: '30px', padding: '5px', marginLeft: '10px'}}
                                            onClick={() => handleRemoveNewImage(index)}
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="control has-text-centered">
                        <button className="button is-primary"
                                onClick={savePost}><i className="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="modal is-active">
                    <div className="modal-background" onClick={() => setIsEditing(false)}></div>
                    <div className="modal-card">
                        <header className="modal-card-head has-background-link-light">
                            <p className="modal-card-title">Edit Post</p>
                            <i
                                className="fas fa-times close-icon"
                                aria-label="close"
                                onClick={() => setIsEditing(false)}
                                style={{fontSize: '24px', cursor: 'pointer', color: 'gray'}}
                            ></i>

                        </header>
                        <section className="modal-card-body">

                            <div className="field">
                                <label className="label">Title <span style={{color: 'red'}}>*</span> </label>
                                <div className="control">
                                    <input className="input" type="text" name="title" placeholder="Title"
                                           value={newPost.title} onChange={handleInputChange}/>
                                </div>
                            </div>

                            {/*<div className="field">*/}
                            {/*    <label className="label">Content <span style={{color: 'red'}}>*</span> </label>*/}
                            {/*    <div className="control">*/}
                            {/*        <textarea className="textarea" name="content" placeholder="Content"*/}
                            {/*                  value={newPost.content} onChange={handleInputChange}></textarea>*/}
                            {/*    </div>*/}
                            {/*</div>*/}

                            <div className="field">
                                <label className="label">
                                    Content <span style={{color: "red"}}>*</span>
                                </label>
                                <div className="control">
                                    <EditorComponent
                                        onChange={handleEditorChange}
                                        initialContent={newPost.content} // Pass content to editor
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">
                                    Category <span style={{color: 'red'}}>*</span>
                                </label>
                                <div className="control">
                                    <div className="select">
                                        <select
                                            name="category"
                                            value={newPost.category}
                                            onChange={handleInputChange}
                                            style={{border: '1px solid #00d1b2', borderRadius: '12px'}}
                                        >
                                            <option value="">Select</option>
                                            <option value="Environmental">Environmental</option>
                                            <option value="Social">Social</option>
                                            <option value="Economic">Economic</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">
                                    Tags <span style={{color: 'red'}}>*</span>
                                </label>
                                <div className="control">
                                    <input
                                        className="input"
                                        type="text"
                                        name="tags"
                                        placeholder="Enter tags with #"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)} // Update input state
                                        onKeyDown={handleTagInput} // Add tag when 'Enter' is pressed
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <div className="tags">
                                    {tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="tag is-link is-rounded"
                                            style={{
                                                marginRight: "5px",
                                                cursor: "pointer",  // Allow user to click to remove
                                            }}
                                            onClick={() => handleRemoveTag(tag)}  // Remove tag when clicked
                                        >
                                     {tag}
                                </span>
                                    ))}
                                </div>
                            </div>


                            <div className="field">
                                <label className="label">Image</label>
                                <div className="control">
                                    <input
                                        type="file"
                                        className="input"
                                        onChange={(e) => setImages(Array.from(e.target.files))}
                                        multiple
                                    />
                                </div>
                            </div>
                            {/* Newly Selected Images */}
                            {images.length > 0 && (
                                <div className="field">
                                    <p>Selected Images:</p>
                                    <ul>
                                        {images.map((image, index) => (
                                            <li key={index}
                                                style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                                                <img
                                                    src={URL.createObjectURL(image)}  // Use URL.createObjectURL for local file reference
                                                    alt={`Selected ${index}`}
                                                    width="100"
                                                    style={{marginRight: '10px'}}  // Add space between image and button
                                                />
                                                <span>{image.name}</span>
                                                <button
                                                    className="button is-danger is-light is-small"
                                                    style={{
                                                        width: '30px',
                                                        height: '30px',
                                                        padding: '5px',
                                                        marginLeft: '10px'
                                                    }}
                                                    onClick={() => handleRemoveNewImage(index)}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {/* Existing Images */}
                            {existingImages.length > 0 && (
                                <div className="field">
                                    <p>Existing Images:</p>
                                    <ul>
                                        {existingImages.map((image) => (
                                            <li key={image.id}
                                                style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                                                <img
                                                    src={`http://localhost:8000${image.url}`}
                                                    alt={`image_id ${image.id}`}
                                                    width="100"
                                                    style={{marginRight: '10px'}} // Space between image and button
                                                />
                                                <span
                                                    style={{flex: 1}}>{`Image ID: ${image.id}`}</span> {/* Show image ID for clarity */}
                                                <button
                                                    className="button is-danger is-light is-small"
                                                    style={{
                                                        width: '30px',
                                                        height: '30px',
                                                        padding: '5px',
                                                        marginLeft: '10px'
                                                    }} // Space between span and button
                                                    onClick={() => handleRemoveExistingImage(currentPostId, image.id)}
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
                                    <button className="delete" onClick={() => setErrorMessage('')}></button>
                                    {errorMessage}
                                </div>
                            )}

                        </section>
                        <footer className="modal-card-foot has-background-link-light"
                                style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <button className="button" onClick={savePost}>
                                <i className="fas fa-check"></i>
                            </button>
                        </footer>

                    </div>
                </div>
            )}

            {successMessage &&
                <p className="notification is-primary is-light has-text-centered"><strong>{successMessage}</strong></p>}

            {userRole !== "admin" && (
  <>
            <h3 className="title is-large">My Posts</h3>
            <div className="box" style={{
                border: '3px solid #00d1b2',
                maxHeight: '650px',
                overflowY: 'auto',
            }}>
                {posts.length === 0 ? (
                    <p className="has-text-centered" style={{color: '#888', fontSize: '1.2em'}}>No posts available</p>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', // Two columns with a minimum of 300px width
                        gap: '20px',  // Space between the posts
                    }}>
                        {posts.map((post) => (
                            <div key={post.id} className="box" style={{position: 'relative', height: '465px',}}>
                                <p style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    fontSize: '0.9em',
                                    color: 'black'
                                }}>
                                    {formatDate(post.created_at)}
                                </p>
                                <br/>
                                <Link to={`/post/${post.id}`}>
                                    <h4 className="title is-5">{post.title}</h4>
                                </Link>

                                <br/>
                                <div className="tags">
                                    {post.tags.map((tag, index) => (
                                        <span key={index} className="tag is-link is-rounded">{tag}</span>
                                    ))}
                                </div>

                                <br/>
                                {post.images && post.images.length > 0 ? (
                                    <figure style={{
                                        width: '100%',
                                        height: '200px',
                                        overflow: 'hidden',
                                        margin: 0
                                    }}>
                                        <img
                                            src={`http://localhost:8000${post.images[0].url}`}
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
                                    <div style={{
                                        width: '100%',
                                        height: '200px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: '#f0f0f0',
                                        color: '#888',
                                    }}>
                                        No Image Available
                                    </div>
                                )}
                                <br/>
                                <div className="buttons is-centered">
                                    <button
                                        className="button is-link is-light is-small"
                                        style={{
                                            width: '50px',
                                            height: '40px',
                                            padding: '5px',
                                        }}
                                        onClick={() => editPost(post)}
                                    >
                                        <i className="fas fa-pencil-alt"></i>
                                    </button>
                                    <button className="button is-danger is-light is-small"
                                            style={{
                                                width: '50px',
                                                height: '40px',
                                                padding: '5px',
                                            }}
                                            onClick={() => openDeleteModal(post.id)}>
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
             </>
)}

            {isModalOpen && (
                <div className="modal is-active">
                    <div className="modal-background" onClick={closeDeleteModal}></div>
                    <div className="modal-content">
                        <div className="box">
                            <h4 className="title is-4">Are you sure you want to delete this post?</h4>
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


        </div>

    );
};

export default UserProfile;