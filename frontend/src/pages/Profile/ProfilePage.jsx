import { useState, useEffect } from "react";
import endpoints from "../config/endpoints"; // Import endpoints.js

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(endpoints.PROFILE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUserProfile(data[0]); // API trả về mảng, lấy phần tử đầu tiên
    };

    fetchUserProfile();
  }, []);

  if (!userProfile) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h2>Profile</h2>
      <p>
        <strong>Name:</strong> {userProfile.display_name}
      </p>
      <p>
        <strong>Email:</strong> {userProfile.user.email}
      </p>
      <p>
        <strong>Bio:</strong> {userProfile.bio}
      </p>
      <img src={userProfile.avatar} alt="Avatar" width="100" />
      <p>
        <strong>Social Link:</strong>{" "}
        <a
          href={userProfile.social_link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {userProfile.social_link}
        </a>
      </p>
    </div>
  );
};

export default ProfilePage;
