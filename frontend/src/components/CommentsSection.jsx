import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import UserAvatar from "./UserAvatar";


const CommentsSection = () => {
  const { id } = useParams(); // Post ID
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [token, , username, userId] = useContext(UserContext);

  useEffect(() => {
    fetchComments();
  }, [id]);

const fetchComments = async () => {
  try {
    const response = await fetch(`http://localhost:8000/comments/post/${id}`);
    if (!response.ok) throw new Error("Failed to fetch comments");

    const data = await response.json();

    // Sort comments by created_at (newest first)
    const sortedComments = data.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    setComments(sortedComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
  }
};


  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const response = await fetch("http://localhost:8000/comments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment,
          post_id: id,
          user_id: userId,
        }),
      });
      if (!response.ok) throw new Error("Failed to post comment");
      setNewComment("");
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  return (
    <div className="box">
      <h2 className="title is-4">Comments</h2>

      {token && (
        <form onSubmit={handleCommentSubmit}>
          <div className="field">
            <div className="control">
              <textarea
                className="textarea"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                required
              ></textarea>
            </div>
          </div>
          <div className="control">
            <button className="button is-primary">Post Comment</button>
          </div>
        </form>
      )}
      <br />
      {comments.length > 0 ? (
        comments.map((comment) => (
          <article key={comment.id} className="media">
            <figure className="media-left">
              <p className="image is-48x48">
                <UserAvatar user_id={comment.user_id} />
              </p>
            </figure>
            <div className="media-content">
              <div className="content" style={{position: 'relative', maxHeight: '470px'}}>
                <p>
                  <strong>{comment.user?.username || "Anonymous"}</strong>
                  <br />
                  {comment.content}
                   <p
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      fontSize: '0.9em',
                      color: 'black',
                    }}
                >
                  {new Date(comment.created_at).toLocaleString()}
                </p>
                </p>
              </div>
            </div>
          </article>
        ))
      ) : (
        <p className="has-text-grey-light">No comments yet.</p>
      )}
    </div>
  );
};

export default CommentsSection;
