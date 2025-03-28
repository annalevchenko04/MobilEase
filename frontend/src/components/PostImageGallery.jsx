import { useState, useEffect } from "react";

const PostImageGallery = ({ postId }) => {
    const [post, setPost] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch post data (including images)
    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await fetch(`http://localhost:8000/post/${postId}`);
                if (!response.ok) throw new Error("Post not found");
                const data = await response.json();
                setPost(data);
            } catch (error) {
                setErrorMessage(error.message);
            }
        };

        fetchPost();
    }, [postId]);

    // Open modal with selected image index
    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedImageIndex(null);
    };

    // Navigate between images
    const goToPreviousImage = () => {
        setSelectedImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
    };

    const goToNextImage = () => {
        setSelectedImageIndex((prevIndex) => (prevIndex < post.images.length - 1 ? prevIndex + 1 : prevIndex));
    };

    if (errorMessage) {
        return <p style={{ color: "red" }}>{errorMessage}</p>;
    }

    if (!post) {
        return <p>Loading post...</p>;
    }

    return (
        <div>
            <div className="columns is-multiline is-flex is-justify-content-center">
                {post.images && post.images.length > 0 ? (
                    post.images.map((image, index) => (
                        <div className="column is-one-third" key={image.id}>
                            <figure className="image is-4by3">
                                <img
                                    src={`http://localhost:8000${image.url}`}
                                    alt={post.title}
                                    style={{ objectFit: "cover", cursor: "pointer" }}
                                    onClick={() => handleImageClick(index)}
                                />
                            </figure>
                            <p className="has-text-centered">
                                <small>Uploaded on: {new Date(image.upload_date).toLocaleDateString()}</small>
                            </p>
                        </div>
                    ))
                ) : (
                    <div
                        style={{
                            width: "300px",
                            height: "200px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f0f0f0",
                            color: "#888",
                        }}
                    >
                        No Images Available
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && selectedImageIndex !== null && post.images[selectedImageIndex] && (
                <div className="modal is-active">
                    <div className="modal-background" onClick={closeModal}></div>
                    <div className="modal-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                            {/* Previous Button */}
                            {selectedImageIndex > 0 && (
                                <button
                                    onClick={goToPreviousImage}
                                    style={{
                                        position: "absolute",
                                        left: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                                        color: "white",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "24px",
                                        padding: "10px",
                                        zIndex: 1,
                                    }}
                                >
                                    ◀
                                </button>
                            )}

                            {/* Selected Image */}
                            <figure className="image" style={{ textAlign: "center" }}>
                                <img
                                    src={`http://localhost:8000${post.images[selectedImageIndex].url}`}
                                    alt="Selected"
                                    style={{
                                        objectFit: "contain",
                                        maxHeight: "90vh",
                                        maxWidth: "90%",
                                        margin: "0 auto",
                                    }}
                                />
                            </figure>

                            {/* Next Button */}
                            {selectedImageIndex < post.images.length - 1 && (
                                <button
                                    onClick={goToNextImage}
                                    style={{
                                        position: "absolute",
                                        right: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                                        color: "white",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "24px",
                                        padding: "10px",
                                        zIndex: 1,
                                    }}
                                >
                                    ▶
                                </button>
                            )}
                        </div>
                    </div>
                    <button className="modal-close is-large" aria-label="close" onClick={closeModal}></button>
                </div>
            )}
        </div>
    );
};

export default PostImageGallery;
