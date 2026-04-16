import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from "../context/UserContext";

import API_URL from "../config";
const EventModal = ({ event, handleClose, selectedDate, handleDeleteEvent }) => {
  const [token, , username, userId, userRole] = useContext(UserContext);
  const [name, setName] = useState(event ? event.name : '');
  const [description, setDescription] = useState(event ? event.description : '');
  const [time, setTime] = useState(event ? event.time : '');
  const [duration, setDuration] = useState(event ? event.duration : 30);
  const [eventType, setEventType] = useState(event ? event.event_type : (userRole === 'member' ? 'private' : 'public'));
  const [isPersonalTraining, setIsPersonalTraining] = useState(event ? event.is_personal_training : false);
  const [maxParticipants, setMaxParticipants] = useState(event ? event.max_participants : 1);
  const [roomNumber, setRoomNumber] = useState(event ? event.room_number : '');
  const [trainerId, setTrainerId] = useState(event ? event.trainer_id : null);
  const [errorMessage, setErrorMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const [price, setPrice] = useState(event ? event.price : 0);
  const [distance, setDistance] = useState(event ? event.distance_km : 0);
const [postId, setPostId] = useState("");
const [drivers, setDrivers] = useState([]);
const [driverId, setDriverId] = useState("");

useEffect(() => {
  const fetchDrivers = async () => {
    const res = await fetch(`${API_URL}/drivers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setDrivers(Array.isArray(data) ? data : []);
  };

  fetchDrivers();
}, [token]);

useEffect(() => {
  if (event) {
    setName(event.name ?? "");
    setDescription(event.description ?? "");
    setTime(event.time ?? "");
    setDuration(event.duration ?? 30);
    setEventType(event.event_type ?? (userRole === "member" ? "private" : "public"));

    setMaxParticipants(event.max_participants ?? 1);
    setRoomNumber(event.room_number ?? "");
    setTrainerId(event.trainer_id ?? null);

    setPostId(event.post_id ? String(event.post_id) : "");
    setDriverId(event.driver_id ? String(event.driver_id) : "");

    if (event.post) {
      setPrice(event.post.price ?? 0);
      setDistance(event.post.distance_km ?? 0);

      // ⚠️ ONLY set name if you want overwrite behavior
      setName(event.post.title ?? event.name ?? "");
    }
  }
}, [event]);

  const handleSave = async () => {
    // Validation
    if (name === '' || time === ''  || eventType === '') {
      setErrorMessage('Please fill in all required fields');
      return;
    }
    if(duration <= 0){
      setErrorMessage('Please set duration more than 0 hour');
      return;
    }

    // Ensure 'member' cannot create public events
    const finalEventType = userRole === 'member' ? 'private' : eventType;

    const requestOptions = {
      method: event?.id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
      name,
      description,
      date: selectedDate,
      time,
      duration,
      event_type: finalEventType,
      is_personal_training: isPersonalTraining,
      max_participants: maxParticipants > 0 ? maxParticipants : null,
      room_number: roomNumber || null,
      trainer_id: isPersonalTraining ? trainerId : null,
      post_id: postId,
      driver_id: driverId || null,
    }),
    };

    const url = event?.id
      ? `${API_URL}/event/${event.id}`
      : `${API_URL}/event`;

    try {
      const response = await fetch(url, requestOptions);
      if (!response.ok) throw new Error(`Failed to ${event?.id ? 'update' : 'create'} event`);
      handleClose();  // Close modal and refresh events
    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
    }
  };

  const handleDelete = () => {
    if (event?.id) {
      handleDeleteEvent(event.id); // Call the passed delete function with event id
      handleClose(); // Close the modal after deletion
    }
  };
useEffect(() => {
  fetch(`${API_URL}/posts`)
    .then(res => res.json())
    .then(data => {
      console.log("POSTS RESPONSE:", data);
      setPosts(data);
    })
    .catch(err => console.error("Failed to load posts", err));
}, []);



  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={handleClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{event?.id ? 'Update Route' : 'Add Route'}</p>
        </header>
        <section className="modal-card-body">
          <div className="field">
            <label className="label">Route Title</label>
            <div className="select is-fullwidth">
            <select
              value={postId}
              onChange={(e) => {
                const selectedId = e.target.value;
                setPostId(selectedId);

                const selectedPost = posts.find(p => String(p.id) === selectedId);

                if (selectedPost) {
                  setName(selectedPost.title);
                  setDuration(selectedPost.estimated_duration ?? 30);
                  setDescription(`${selectedPost.from_city ?? ''} → ${selectedPost.to_city ?? ''}`);
                  setPrice(selectedPost.price ?? 0);
                  setDistance(selectedPost.distance_km ?? 0);
                }
              }}
            >
                <option value="">Select a route</option>
                {posts.map(post => (
                   <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label">Description</label>
            <div className="control">
              <input
                  type="text"
                  className="input"
                  value={description ?? ""}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
              />
            </div>
          </div>

                  <div className="field">
          <label className="label">Price</label>
          <div className="control">
            <input
              type="number"
              className="input"
              value={price ?? 0}
              onChange={(e) => setPrice(e.target.value)}
              readOnly
            />
          </div>
        </div>
            <div className="field">
              <label className="label">Distance (km)</label>
              <div className="control">
                <input
                  type="number"
                  className="input"
                  value={distance ?? 0}
                  onChange={(e) => setDistance(e.target.value)}
                  readOnly
                />
              </div>
            </div>
          <div className="field">
            <label className="label">Event Date</label>
            <div className="control">
              <input
                  type="text"
                  className="input"
                  value={selectedDate} // Pre-filled selected date
                  readOnly
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Time</label>
            <div className="control">
              <input
                  type="time"
                  className="input"
                  value={time ?? ""}
                  onChange={(e) => setTime(e.target.value)}
                  required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Duration (hours)</label>
            <div className="control">
              <input
                  type="number"
                  className="input"
                  value={duration ?? 0}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Enter duration (min. 15)"
                  required
              />
            </div>
          </div>

          {/* Event Type Selection: Only show for non-members */}
          {userRole !== 'member' && (
              <div className="field">
                <label className="label">Event Type</label>
                <div className="control">
                  <div className="select">
                    <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </div>
          )}

          {/* Show only if event is public */}
          {eventType === 'public' && (
              <>
                <div className="field">
                  <label className="label">Max Participants</label>
                  <div className="control">
                    <input
                        type="number"
                        className="input"
                        value={maxParticipants ?? 0}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        placeholder="Enter max participants"
                    />
                  </div>
                </div>

                <div className="field">
  <label className="label">Assign Driver</label>
  <div className="select is-fullwidth">
    <select
      value={driverId}
      onChange={(e) => setDriverId(e.target.value)}
    >
      <option value="">Select a driver</option>

      {Array.isArray(drivers) && drivers.map(driver => (
        <option key={driver.id} value={driver.id}>
          {driver.name} {driver.surname}
        </option>
      ))}
    </select>
  </div>
</div>

                <div className="field">
                  <label className="label">Address</label>
                  <div className="control">
                    <input
                        type="text"
                        className="input"
                        value={roomNumber ?? ""}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="Enter place"
                    />
                  </div>
                </div>
              </>
          )}


          {errorMessage && <p className="help is-danger">{errorMessage}</p>}
        </section>
        <footer className="modal-card-foot">
          <button
              className="button is-primary"
              onClick={handleSave}
              style={{marginRight: '10px'}} // Add margin to the right
          >
            Save Event
          </button>
          {event?.id && (  // Show delete button only if it's an existing event
              <button className="button is-danger" onClick={handleDelete}>
                Delete Event
              </button>
          )}
          <button
              className="button"
              onClick={handleClose}
              style={{marginLeft: '10px'}} // Add margin to the right
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EventModal;
