import { FC, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface UserProfile {
    id: number;
    username: string;
    email: string;
}

interface ProfileData {
    id: number;
    user: UserProfile;
    display_name: string | null;
    bio: string | null;
    avatar: string;
    social_link: string;
    created_at: string;
}

interface ProfileModalProps {
    isOpen: boolean;
    data: ProfileData | null;
    onClose: () => void;
}

const getSocialIcon = (url: string) => {
    if (url.includes("facebook.com")) return <img src="/icons/facebook.svg" className="w-5 h-5" />;
    if (url.includes("twitter.com")) return <img src="/icons/twitter.svg" className="w-5 h-5" />;
    if (url.includes("instagram.com")) return <img src="/icons/instagram.svg" className="w-5 h-5" />;
    return <img src="/icons/github.svg" className="w-5 h-5" />;
};

const ProfileModal: FC<ProfileModalProps> = ({ isOpen, onClose, data }) => {
    const { theme } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<ProfileData | null>(data);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewAvatar, setPreViewAvatar] = useState<string | null>(data?.avatar || null);

    if (!profile) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="p-6 rounded-lg w-full max-w-lg bg-white dark:bg-gray-800 shadow-lg">
                    <p className="text-center text-gray-500 dark:text-gray-300">Failed to load profile</p>
                    <Button onClick={onClose} className="w-full mt-4">Close</Button>
                </DialogContent>
            </Dialog>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfile(prev => prev ? { ...prev, [e.target.name]: e.target.value } : null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreViewAvatar(URL.createObjectURL(file));
        }
    };

    const handleSave = async() => {
        try {
            const dataToSave = new FormData();
            dataToSave.append("display_name", profile.display_name || "");
            dataToSave.append("bio", profile.bio || "");
            dataToSave.append("social_link", profile.social_link || "");
            if (selectedFile) {
                dataToSave.append("avatar", selectedFile);
            }
            const profile_id = localStorage.getItem("profile_id");
            const response = await fetch(`http://127.0.0.1:8000/profile/${profile_id}/`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: dataToSave
            });
            if (!response.ok) 
                throw new Error("Cannot update the profile of the user!");
            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            setPreViewAvatar(updatedProfile.avatar);
            setIsEditing(false);
        } catch (error) {
            console.log(error);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSelectedFile(null);
        setProfile(data);
        setPreViewAvatar(profile.avatar);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-6 rounded-lg w-full max-w-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text text-center">
                        My Profile
                    </DialogTitle>
                </DialogHeader>
                <div className="flex space-x-6">
                    <div className="flex flex-col items-center w-1/3 relative">
                        <Avatar className="w-24 h-24 mb-2 border-4 border-purple-300 shadow-md">
                            <img src={previewAvatar || profile.avatar} className="w-full h-full rounded-full" />
                        </Avatar>
                        {isEditing && (
                            <label className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gray-200 dark:bg-gray-700 p-1 rounded-full cursor-pointer">
                                <Camera className={`w-5 h-5 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`} />
                                <input type="file" className="hidden" onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
                    <div className="w-2/3 space-y-4">
                        <div>
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Display Name</label>
                            <input
                                type="text"
                                name="display_name"
                                value={profile.display_name || ""}
                                className="text-[15px] w-full p-2 border rounded-md bg-white dark:bg-gray-800 dark:text-white"
                                readOnly={!isEditing}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="text"
                                value={profile.user.email}
                                className="text-[15px] w-full p-2 border rounded-md bg-white dark:bg-gray-800 dark:text-white"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Bio</label>
                            <textarea
                                name="bio"
                                value={profile.bio || ""}
                                className="text-[15px] w-full p-2 border rounded-md bg-white dark:bg-gray-800 dark:text-white"
                                readOnly={!isEditing}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Joined On</label>
                            <input
                                type="text"
                                value={new Date(profile.created_at).toLocaleDateString("vi-VN")}
                                className="text-[15px] w-full p-2 border rounded-md bg-white dark:bg-gray-800 dark:text-white"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Social Link</label>
                            <div className="flex items-center space-x-2">
                                {profile.social_link && (
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {getSocialIcon(profile.social_link)}
                                    </span>
                                )}
                                <input 
                                    type="text" 
                                    name="social_link" 
                                    value={profile.social_link || ""} 
                                    className="text-[15px] w-full p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200" 
                                    readOnly={!isEditing}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between w-full mt-4">
                    <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
                        Close
                    </Button>
                    <div className="flex space-x-2 ml-auto">
                        <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => isEditing ? handleCancel() : setIsEditing(true)}>
                            {isEditing ? "Cancel" : "Edit"}
                        </Button>
                        {isEditing && (
                            <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={handleSave}>
                                Save
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileModal;

export const getProfile = async (username: string) => {
    try {
        console.log(localStorage.getItem("token"))
        const response = await fetch(`http://127.0.0.1:8000/profile/get-profile/?username=${username}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (!response.ok) throw new Error("Error fetching profile data!");
        const data = await response.json();
        localStorage.setItem("profile_id", data.id);
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};