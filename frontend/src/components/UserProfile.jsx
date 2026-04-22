import React, { useEffect, useState, useContext, useCallback,  useRef } from "react";
import { UserContext } from "../context/UserContext";
import { Link } from "react-router-dom";
import EditorComponent from "./EditorComponent";
import TicketPage from "./TicketPage";
import { useNavigate } from "react-router-dom";
import API_URL from "../config";
import CarsManagement from "./CarsManagement";
import UserAvatar from "../components/UserAvatar";
import LocationFields from "./LocationFields";
const UserProfile = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [error, setError] = useState(null);
    const [token, userRole, username, userId,] = useContext(UserContext); // Get the token from context
    const [avatarFile, setAvatarFile] = useState(null); // Holds the selected file (before upload)
    const [avatarUrl, setAvatarUrl] = useState(null);    // Holds the uploaded avatar URL
    const [avatarId, setAvatarId] = useState(null); // Use this to store avatarId
    const [trips, setTrips] = useState([]);
    const [showTicket, setShowTicket] = useState(false);
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [editForm, setEditForm] = useState({
      name: "",
      surname: "",
      age: "",
      gender: "",
      phone: "",
      email: "",
      password: ""
    });
const requiredRouteFields = [
  "title",
  "from_country",
  "from_city",
  "to_country",
  "to_city",
  "distance_km",
  "estimated_duration",
  "price",
];
    const [newPost, setNewPost] = useState({
        title: '',
        tags: [],
        from_country: '',
        from_city: '',
        to_country: '',
        to_city: '',
        distance_km: '',
        estimated_duration: '',
        price: ''
    });
    const toLocal = (utcString) => {
  // Ensure the string ends with Z (UTC)
  const normalized = utcString.endsWith("Z")
    ? utcString
    : utcString.replace(" ", "T") + "Z";

  return new Date(normalized).toLocaleString();
};
    const openEditDriver = (driver) => {
      setEditingDriver(driver);
      setShowEditModal(true);
    };

    const openDeleteDriver = (id) => {
      setDeleteDriverId(id);
      setShowDeleteModal(true);
    };
    const [editingDriver, setEditingDriver] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deleteDriverId, setDeleteDriverId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [rentals, setRentals] = useState([]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [driverEvents, setDriverEvents] = useState([]);
const [driverSalary, setDriverSalary] = useState(null);
const [allDrivers, setAllDrivers] = useState([]);
 const fetchDrivers = async () => {
    try {
      const res = await fetch(`${API_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAllDrivers(data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };


useEffect(() => {
  const fetchDrivers = async () => {
    try {
      const res = await fetch(`${API_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        console.error("Failed to fetch drivers");
        return;
      }

      const data = await res.json();
      setAllDrivers(data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  if (userRole === "admin") {
    fetchDrivers();
  }
}, [userRole, token]);

useEffect(() => {
  if (trips.length > 0) {
    trips.forEach(async (booking) => {
      const postId = booking.event?.post?.id;
      if (!postId) return;

      const res = await fetch(`${API_URL}/posts/${postId}/images`);
      const data = await res.json();

      setPostImages(prev => ({
        ...prev,
        [postId]: data
      }));
    });
  }
}, [trips]);
useEffect(() => {
  if (token && userRole === "driver") {
    fetchDriverEvents();
    fetchDriverSalary();
  }
}, [token, userRole]);
useEffect(() => {
  const fetchRentals = async () => {
    const res = await fetch(`${API_URL}/rentals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRentals(data);
  };

  if (token) fetchRentals();
}, [token]);
useEffect(() => {
  const fetchSalary = async () => {
    let url = `${API_URL}/driver/salary`;

    const params = [];
    if (selectedMonth) params.push(`month=${selectedMonth}`);
    if (selectedYear) params.push(`year=${selectedYear}`);

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    setDriverSalary(data);
  };

  fetchSalary();
}, [selectedMonth, selectedYear, token]);
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
                const response = await fetch(`${API_URL}/user/${username}`, requestOptions);

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
            const response = await fetch(`${API_URL}/users/${userId}/badges`, requestOptions);
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
useEffect(() => {
  if (userProfile) {
    setEditForm({
      name: userProfile.name || "",
      surname: userProfile.surname || "",
      age: userProfile.age || "",
      gender: userProfile.gender || "",
      phone: userProfile.phone || "",
      email: userProfile.email || "",
      password: ""
    });
  }
}, [userProfile]);

useEffect(() => {
  fetch(`${API_URL}/bookings`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      console.log("TRIPS RESPONSE:", data);
      if (Array.isArray(data)) {
        setTrips(data);
      } else {
        setTrips([]); // prevent crashes
      }
    })
    .catch(err => console.error("Failed to load trips", err));
}, []);

const fetchDriverEvents = async () => {
  const res = await fetch(`${API_URL}/driver/events`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  setDriverEvents(data);
};
const saveProfileChanges = async () => {
  try {
    const token = localStorage.getItem("token");

    // Build payload with only non-empty fields
    const payload = {};
    Object.entries(editForm).forEach(([key, value]) => {
      if (value !== "" && value !== null) payload[key] = value;
    });

    const response = await fetch(`${API_URL}/user/${userProfile.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to update profile");

    const updated = await response.json();
    setUserProfile(updated);
    setIsEditingUser(false);
    setSuccessMessage("Profile updated successfully!");

  } catch (err) {
    console.error(err);
  }
};

const fetchDriverSalary = async () => {
  const res = await fetch(`${API_URL}/driver/salary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  setDriverSalary(data);
};
 const fetchPosts = useCallback(async () => {
  try {
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await fetch(`${API_URL}/users/${userId}/myposts`, requestOptions);
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

const saveDriverChanges = async () => {
  // 🔴 Validation
  if (
    !editingDriver.phone?.trim() ||
    !editingDriver.license_number?.trim() ||
    !editingDriver.salary_rate
  ) {
    setErrorMessage("All fields are required.");
    return;
  }

  if (!editingDriver.phone.startsWith("+")) {
    setErrorMessage("Phone number must start with +.");
    return;
  }

  if (Number(editingDriver.salary_rate) <= 5) {
    setErrorMessage("Salary rate must be more than 5 €.");
    return;
  }

  try {
    await fetch(`${API_URL}/admin/drivers/${editingDriver.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        phone: editingDriver.phone,
        license_number: editingDriver.license_number,
        salary_rate: Number(editingDriver.salary_rate),
      }),
    });

    setErrorMessage(""); // ✅ clear error
    setShowEditModal(false);
    fetchDrivers();
  } catch (err) {
    setErrorMessage("Failed to update driver.");
  }
};
const deleteDriver = async () => {
  await fetch(`${API_URL}/admin/drivers/${deleteDriverId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  setShowDeleteModal(false);
  fetchDrivers();
};
  const fetchUserAvatar = async () => {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/avatar`, {
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
        const fullAvatarUrl = `${API_URL}${data.url}`;
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
        const response = await fetch(`${API_URL}/users/${userId}/avatar/${avatarId}`, {
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
                    title: currentPost.title || "",
                    tags: currentPost.tags || [],
                    from_country: currentPost.from_country || "",
                    from_city: currentPost.from_city || "",
                    to_country: currentPost.to_country || "",
                    to_city: currentPost.to_city || "",
                    distance_km: currentPost.distance_km || "",
                    estimated_duration: currentPost.estimated_duration || "",
                    price: currentPost.price || ""
                });
                setTags(currentPost.tags || []);
            }
        }, 500);
    }
}, [isEditing, currentPostId, posts]);







  // Function to handle removing newly selected images
  const handleRemoveNewImage = (indexToRemove) => {
    setImages((prevImages) => prevImages.filter((_, index) => index !== indexToRemove));
  };

  // Function to handle removing existing images
const handleRemoveExistingImage = async (postId, imageId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/post/${currentPostId}/image/${imageId}`, {
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

          const response = await fetch(`${API_URL}/users/${userId}/post/${postId}/image`, {
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

        const response = await fetch(`${API_URL}/users/${userId}/avatar`, {
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
            const fullAvatarUrl = `${API_URL}${uploadedAvatar.url}`;
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
      const url = isEditing ? `${API_URL}/users/${userId}/post/${currentPostId}` : `${API_URL}/users/${userId}/post`;
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
        from_country: '',
        from_city:'',
        to_country: '',
        to_city: '',
        distance_km: '',
        estimated_duration: '',
        price: '',
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
      const response = await fetch(`${API_URL}/users/${userId}/post/${id}`, requestOptions);
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
                        {successMessage &&
                <p className="notification is-primary is-light has-text-centered"><strong>{successMessage}</strong></p>}
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
                            border: '2px solid #605fc9',
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
                    {!isEditingUser ? (
  <>
    <p className="text-gray-400" style={{fontSize: "20px"}}>
      <i className="fas fa-user mr-2"></i>
      <strong>Name:</strong> {userProfile.name} {userProfile.surname}
    </p>

    <p className="text-gray-400" style={{fontSize: "20px"}}>
      <i className="fas fa-user-circle mr-2"></i>
      <strong>Username:</strong> {userProfile.username}
    </p>

    <p className="text-gray-400" style={{fontSize: "20px"}}>
      <i className="fas fa-birthday-cake mr-2"></i>
      <strong>Age:</strong> {userProfile.age}
    </p>

    <p className="text-gray-400" style={{fontSize: "20px"}}>
      <i className="fas fa-venus-mars mr-1"></i>
      <strong>Gender:</strong> {userProfile.gender}
    </p>

    <p className="text-gray-400" style={{fontSize: "20px"}}>
      <i className="fas fa-phone-alt mr-2"></i>
      <strong>Phone:</strong> {userProfile.phone}
    </p>

    <p className="text-gray-400" style={{fontSize: "20px"}}>
      <i className="fas fa-envelope mr-2"></i>
      <strong>Email:</strong> {userProfile.email}
    </p>

    {userProfile.company && (
      <p className="text-gray-400" style={{fontSize: "20px"}}>
        <i className="fas fa-briefcase mr-2"></i>
        <strong>Role:</strong> {userProfile.role}
      </p>
    )}

    <button
      className="button is-light mt-4"
      onClick={() => setIsEditingUser(true)}
    >
      Edit Profile
    </button>
  </>
) : (
  <>
    {/* EDIT MODE FORM */}
    <div className="field">
      <label className="label">Name</label>
      <input
        className="input"
        value={editForm.name}
        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
      />
    </div>

    <div className="field">
      <label className="label">Surname</label>
      <input
        className="input"
        value={editForm.surname}
        onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
      />
    </div>

    <div className="field">
      <label className="label">Age</label>
      <input
        className="input"
        type="number"
        value={editForm.age}
        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
      />
    </div>

    <div className="field">
      <label className="label">Gender</label>
      <div className="select">
        <select
          value={editForm.gender}
          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
        >
          <option value="">Select gender</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>

    <div className="field">
      <label className="label">Phone</label>
      <input
        className="input"
        value={editForm.phone}
        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
      />
    </div>

    <div className="field">
      <label className="label">Email</label>
      <input
        className="input"
        type="email"
        value={editForm.email}
        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
      />
    </div>

    <div className="field">
      <label className="label">New Password (optional)</label>
      <input
        className="input"
        type="password"
        placeholder="Leave empty to keep current password"
        value={editForm.password}
        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
      />
    </div>

    <button className="button is-primary" onClick={saveProfileChanges}>
      Save Changes
    </button>

    <button
      className="button is-light ml-2"
      onClick={() => setIsEditingUser(false)}
    >
      Cancel
    </button>
  </>
)}


                </div>
            </div>
            <br/>
            <br/>
{userRole === "driver" && (
    <>
       {/* Upcoming Trips */}
<h3 className="title is-large">My Upcoming Trips</h3>

{(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = driverEvents
    .filter(ev => {
      if (!ev.date) return false;
      const eventDateTime = new Date(`${ev.date}T${ev.time || "00:00"}`);
      return eventDateTime >= today;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dateA - dateB;
    });

  return upcomingTrips.length === 0 ? (
    <p>No upcoming trips.</p>
  ) : (
    <div
        style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            paddingBottom: 12,
            paddingTop: 16,
            scrollSnapType: "x mandatory",
            width: "100%",
          }}
    >
      {upcomingTrips.map((ev, index) => {
        const eventDate = new Date(`${ev.date}T${ev.time || "00:00"}`);
        const isNext = index === 0;
        const diffMs = eventDate - new Date();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffHours / 24);
        const timeLeft = diffDays > 0
          ? `in ${diffDays} day${diffDays > 1 ? "s" : ""}`
          : diffHours > 0
          ? `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`
          : "Today";

        return (
          <div
            key={ev.id}
            style={{
              minWidth: 350,
              maxWidth: 350,
              scrollSnapAlign: "start",
              flexShrink: 0,
              border: `2px solid ${isNext ? "#605fc9" : "#e9ecef"}`,
              borderRadius: 14,
              padding: "18px 18px 16px",
              background: isNext ? "#f3f0ff" : "#fff",
              boxShadow: isNext ? "0 4px 16px #605fc920" : "0 2px 8px #0000000a",
              position: "relative",
              transition: "box-shadow 0.2s",
            }}
          >
            {/* Next trip badge */}
            {isNext && (
              <div style={{
                position: "absolute", top: -10, left: 16,
                background: "#605fc9", color: "#fff",
                fontSize: 9, fontWeight: 700, letterSpacing: 1,
                padding: "3px 10px", borderRadius: 10,
              }}>
                NEXT TRIP
              </div>
            )}

            {/* Time left badge */}
            <div style={{
              position: "absolute", top: 14, right: 14,
              background: isNext ? "#605fc920" : "#f1f3f5",
              color: isNext ? "#605fc9" : "#868e96",
              fontSize: 10, fontWeight: 700,
              padding: "3px 8px", borderRadius: 6,
            }}>
              {timeLeft}
            </div>

            {/* Route name */}
            <h5 style={{
              fontWeight: 800, fontSize: 15,
              color: "#2d3436", marginBottom: 4,
              marginTop: isNext ? 8 : 0,
              paddingRight: 0,  // ← remove right padding
              wordBreak: "break-word", // ← allow wrapping
            }}>
              {ev.name}
            </h5>

            {/* Date & time */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#605fc915", borderRadius: 6,
              padding: "4px 10px", marginBottom: 12,
            }}>
              <span style={{ fontSize: 11, color: "#605fc9", fontWeight: 600 }}>
                🕐 {ev.date} · {ev.time}
              </span>
            </div>

            {/* Details */}
            <div style={{ fontSize: 13, color: "#495057", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#868e96", minWidth: 70 }}>⏱ Duration</span>
                <span style={{ fontWeight: 600 }}>{ev.duration} hours</span>
              </div>
              {ev.room_number && (
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#868e96", minWidth: 70 }}>📍 Address</span>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{ev.room_number}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
})()}
        <br/>

        {/* Salary */}
        <h3 className="title is-large">Salary</h3>
<div className="field is-grouped" style={{ marginBottom: "20px" }}>

  {/* Year */}
  <div className="control">
    <label className="label" style={{ marginBottom: "6px" }}>Year</label>
    <div className="select is-rounded is-link is-medium">
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
      >
        <option value="">All years</option>
        {[2025, 2026, 2027].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  </div>

  {/* Month */}
  <div className="control" style={{ marginLeft: "12px" }}>
    <label className="label" style={{ marginBottom: "6px" }}>Month</label>
    <div className="select is-rounded is-link is-medium">
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(Number(e.target.value))}
      >
        <option value="">All months</option>
        {[
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ].map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
    </div>
  </div>

</div>



        {driverSalary ? (
            <>
                 <p className="text-gray-400" style={{fontSize: "20px"}}> Total Hours: {(driverSalary.total_hours || 0).toFixed(2)}</p>
                 <p className="text-gray-400" style={{fontSize: "20px"}}>Rate: €{(driverSalary.salary_rate || 0).toFixed(2)}</p>
                 <p className="text-gray-400" style={{fontSize: "20px"}}> <strong>Total Salary Before Taxes: €{(driverSalary.total_salary || 0).toFixed(2)}</strong></p>
            </>
        ) : (
            <p>No salary data available</p>
        )}

    </>
)}
              {userRole !== "admin" && userRole !== "driver" && (
         <div className="profile-badges">

  <h3 className="title is-large">My Upcoming Trips</h3>

{(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = trips.filter((booking) => {
    if (!booking.event?.date) return false;

    // assuming date: "YYYY-MM-DD", time: "HH:MM"
    const eventDateTime = new Date(
      `${booking.event.date}T${booking.event.time || "00:00"}`
    );

    return eventDateTime >= today;
  });

  return upcomingTrips.length === 0 ? (
    <p>No trips booked yet.</p>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "20px",
      }}
    >
      {upcomingTrips.map((booking) => (
        <div
          key={booking.id}
          className="box"
          style={{
            position: "relative",
            maxHeight: "470px",
            border: "3px solid #605fc9",
          }}
        >
          {/* Created at */}
          <p
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              fontSize: "0.9em",
              color: "black",
            }}
          >
            {booking.event?.date} {booking.event?.time}
          </p>

          {/* Event title */}
          <h5 className="title is-5">{booking.event?.name}</h5>

          {/* Trip details */}
          <p style={{ marginTop: "10px" }}>
            <strong>From:</strong> {booking.event?.post?.from_city},{" "}
            {booking.event?.post?.from_country}
            <br />
            <strong>To:</strong> {booking.event?.post?.to_city},{" "}
            {booking.event?.post?.to_country}
            <br />
            <strong>Address:</strong> {booking.event?.room_number}
            <br />
            <strong>Seat:</strong> #{booking.seat_number}
          </p>

          {/* Ticket button */}
          <p
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
            }}
          >
            <button
              className="button is-link is-outlined"
              onClick={() => {
                setSelectedBookingId(booking.id);
                setShowTicket(true);
              }}
            >
              Show QR-code
            </button>
          </p>
        </div>
      ))}
    </div>
  );
})()}
             <br/>
             <br/>
             <h3 className="title is-large">My Upcoming Car Rentals</h3>

{(() => {
const now = new Date();

const upcomingRentals = rentals.filter((rental) => {
  if (!rental.end_datetime) return false;

    const endUTC = new Date(rental.end_datetime);
    const endLocal = new Date(endUTC.getTime() - endUTC.getTimezoneOffset() * 60000);

    return endLocal >= now;
});

  return upcomingRentals.length === 0 ? (
    <p>No upcoming car rentals.</p>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "20px",
      }}
    >
      {upcomingRentals.map((rental) => (
        <div
          key={rental.id}
          className="box"
          style={{
            position: "relative",
            maxHeight: "470px",
            border: "3px solid #605fc9",
          }}
        >
          {/* Rental date */}
          <p
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              fontSize: "0.9em",
              color: "black",
            }}
          >
            {new Date(rental.start_datetime).toLocaleDateString()}{" "}
            {new Date(rental.start_datetime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
<br/>

          {/* Car title */}
          <h5 className="title is-5">
            {rental.car?.brand} {rental.car?.model} ({rental.car?.year})
          </h5>

          {/* Car image */}
          {rental.car?.images?.length > 0 ? (
            <figure
              style={{
                width: "100%",
                height: "200px",
                overflow: "hidden",
                margin: 0,
              }}
            >
              <img
                src={`${API_URL}${rental.car.images[0].url}`}
                alt="Car"
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

          {/* Rental details */}
          <p style={{ marginTop: "10px" }}>
            <strong>Start:</strong> {toLocal(rental.start_datetime)}
            <br />
            <strong>End:</strong> {toLocal(rental.end_datetime)}
            <br />
            <strong>Kilometers:</strong> {rental.kilometers_used} km
            <br />
            <strong>Total Price:</strong> €{rental.total_price}
            <br />
            <strong>Status:</strong> {rental.status}
          </p>

        </div>
      ))}
    </div>
  );
})()}

         </div>)}
            <br/>
{userRole === "admin" && (
  <div className="has-text-centered">
    <button
      className="button is-primary is-outlined is-medium"
      style={{ borderWidth: '3px' }}
      onClick={() => {
        setIsCreating(!isCreating);
        setIsEditing(false);

        // FIXED: reset all fields properly
        setNewPost({
          title: '',
          tags: [],
          from_country: '',
          from_city: '',
          to_country: '',
          to_city: '',
          distance_km: '',
          estimated_duration: '',
          price: ''
        });

        setExistingImages([]);
        setTags([]);
      }}
    >
      {isCreating ? <i className="fas fa-times"></i> : "Create New Route"}
    </button>
  </div>
)}


            <br/>
            <br/>

            {isCreating && (
                <div className="box" style={{border: '3px solid #605fc9'}}>
                    <h3 className="title is-primary">Create a Route</h3>
                    {errorMessage && (
                        <div className="notification is-danger">
                            <button className="delete" onClick={() => setErrorMessage('')}></button>
                            {errorMessage}
                        </div>
                    )}

                    {/* Route Fields */}
                    <div className="field">
                                <label className="label">Title <span style={{color: 'red'}}>*</span> </label>
                                <div className="control">
                                    <input className="input" type="text" name="title" placeholder="Title"
                                           value={newPost.title} onChange={handleInputChange} style={{ border: '1px solid #605fc9', borderRadius: '12px' }}/>
                                </div>
                    </div>
                    <LocationFields newPost={newPost} handleInputChange={handleInputChange} />
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
                                border: '1px solid #605fc9',
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
                                    border: '1px solid #605fc9',
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
                            <p className="modal-card-title">Edit Route</p>
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

                                <div className="field">
                                    <LocationFields
                                        newPost={newPost}
                                        handleInputChange={handleInputChange}
                                    />
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
                                                    src={`${API_URL}${image.url}`}
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



            {userRole == "admin" && (
  <>
            <h3 className="title is-large">Routes</h3>
            <div className="box" style={{
                border: '3px solid #605fc9',
                maxHeight: '650px',
                overflowY: 'auto',
            }}>
                {posts.length === 0 ? (
                    <p className="has-text-centered" style={{color: '#888', fontSize: '1.2em'}}>No routes available</p>
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
                                    {new Date(post.created_at).toLocaleString()}
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
                                            src={`${API_URL}${post.images[0].url}`}
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

            {showTicket && (
              <TicketPage
                token={token}
                bookingId={selectedBookingId}
                onClose={() => setShowTicket(false)}
              />
            )}
            {userRole === "admin" && (
              <div className="mt-6">
                <CarsManagement />
              </div>
            )}
             {userRole === "admin" && (
  <div className="mt-6">
    <h3 className="title is-3">Driver Overview</h3>


          <Link to="/register-driver" className="button is-link">
      Register New Driver
    </Link>
      <br/>
      <br/>
    <table className="table is-striped is-fullwidth">
      <thead>
        <tr>
          <th>Photo</th>
          <th>Name</th>
          <th>Surname</th>
          <th>Email</th>
          <th>Phone</th>
          <th>License Number</th>
          <th>Salary Rate (€ / hour)</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {allDrivers.length === 0 ? (
          <tr>
            <td colSpan="8" className="has-text-centered">
              No drivers found
            </td>
          </tr>
        ) : (
          allDrivers.map((driver) => (
            <tr key={driver.user_id}>
              <td>
                <UserAvatar user_id={driver.id} />
              </td>
              <td>{driver.name}</td>
              <td>{driver.surname}</td>
              <td>{driver.email}</td>
              <td>{driver.phone}</td>
              <td>{driver.license_number}</td>
              <td>€{driver.salary_rate}</td>

              <td>
                  <div className="buttons is-centered">
                                    <button
                                        className="button is-link is-light is-small"
                                        style={{
                                            width: '30px',
                                            height: '30px',
                                            padding: '5px',
                                        }}
                                         onClick={() => openEditDriver(driver)}
                                    >
                                        <i className="fas fa-pencil-alt"></i>
                                    </button>
                                    <button className="button is-danger is-light is-small"
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                padding: '5px',
                                            }}
                                            onClick={() => openDeleteDriver(driver.id)}>
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
            </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}
{showEditModal && editingDriver && (
  <div className="modal is-active">
    <div className="modal-background" onClick={() => setShowEditModal(false)}></div>
    <div className="modal-card">
      <header className="modal-card-head">
        <p className="modal-card-title">Edit Driver</p>
        <button className="delete" onClick={() => setShowEditModal(false)}></button>
      </header>

      <section className="modal-card-body">
                      {errorMessage && (
              <div className="notification is-danger">
                <button
                  className="delete"
                  onClick={() => setErrorMessage("")}
                ></button>
                {errorMessage}
              </div>
            )}
        <div className="field">
          <label className="label">Phone <span style={{ color: "red" }}>*</span> </label>
          <input
            className="input"
            value={editingDriver.phone || ""}
            onChange={(e) =>
               { setErrorMessage("");
              setEditingDriver({ ...editingDriver, phone: e.target.value })
            }}
          />
        </div>

        <div className="field">
          <label className="label">License Number <span style={{ color: "red" }}>*</span> </label>
          <input
            className="input"
            value={editingDriver.license_number || ""}
            onChange={(e) =>
              { setErrorMessage("");
                  setEditingDriver({ ...editingDriver, license_number: e.target.value })
            }}
          />
        </div>

        <div className="field">
          <label className="label">Salary Rate (€) <span style={{ color: "red" }}>*</span></label>
          <input
            className="input"
            type="number"
            value={editingDriver.salary_rate || ""}
            onChange={(e) =>
                { setErrorMessage("");
              setEditingDriver({ ...editingDriver, salary_rate: e.target.value })
            }}
          />
        </div>
      </section>

      <footer className="modal-card-foot">
        <button className="button is-primary" onClick={saveDriverChanges}>
          Save
        </button>
      </footer>
    </div>
  </div>
)}

            {showDeleteModal && (
  <div className="modal is-active">
    <div className="modal-background" onClick={() => setShowDeleteModal(false)}></div>
    <div className="modal-card">
      <header className="modal-card-head">
        <p className="modal-card-title">Delete Driver</p>
        <button className="delete" onClick={() => setShowDeleteModal(false)}></button>
      </header>

      <section className="modal-card-body">
        Are you sure you want to delete this driver?
      </section>

      <footer className="modal-card-foot">
        <button className="button is-danger" onClick={deleteDriver}>
          Delete
        </button>
        <button className="button" onClick={() => setShowDeleteModal(false)}>
          Cancel
        </button>
      </footer>
    </div>
  </div>
)}
        </div>

    );

};



export default UserProfile;