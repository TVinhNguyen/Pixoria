import { FC, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Trash, Plus } from "lucide-react"; 

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
    data: ProfileData | null;
    loading: boolean;
    onClose: () => void;
}

const getSocialIcon = (url: string) => {
    if (url.includes("facebook.com")) return <img src="/icons/facebook.svg" className="w-5 h-5" />;
    if (url.includes("twitter.com")) return <img src="/icons/twitter.svg" className="w-5 h-5" />;
    if (url.includes("instagram.com")) return <img src="/icons/instagram.svg" className="w-5 h-5" />;
    return <img src="/icons/github.svg" className="w-5 h-5" />;
};

const ProfileModal: FC<ProfileModalProps> = ({ data, loading, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(data);
    const [newSocialLink, setNewSocialLink] = useState("");
    const [isAddingLink, setIsAddingLink] = useState(false);

    const handleChange = (e : any) => {
        setProfile((prevProfile) => prevProfile ? { ...prevProfile, [e.target.name]: e.target.value } : null);
    };
    
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="p-6 rounded-lg w-full max-w-lg bg-white shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text text-center">My Profile</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="text-center p-4 text-blue-500 font-semibold">Loading...</div>
                ) : data ? (
                    <div className="flex space-x-6">
                        <div className="flex flex-col items-center w-1/3 relative">
                            <Avatar className="w-24 h-24 mb-2 border-4 border-blue-300 shadow-md relative">
                                <img src={data.avatar} className="w-full h-full rounded-full" />
                            </Avatar>
                            {isEditing && (
                                <button className="absolute bottom-0 bg-gray-200 p-1 rounded-full shadow">
                                    <Camera className="w-5 h-5 text-gray-600" />
                                </button>
                            )}
                        </div>
                        <div className="w-2/3 space-y-4">
                            <div>
                                <label className="text-[12px] font-bold text-gray-700">Display Name</label>
                                <input type="text" name="display_name" value={profile?.display_name || ""} className="w-full p-2 border rounded-md text-gray-900 bg-gray-90 text-[14px]" readOnly={!isEditing} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-700">Email</label>
                                <input type="text" value={data.user.email} className="w-full p-2 border rounded-md text-gray-900 bg-gray-90 text-[14px]" readOnly />
                            </div>
                            {data.bio && (
                                <div>
                                    <label className="text-[12px] font-bold text-gray-700">Bio</label>
                                    <textarea name="bio" className="w-full p-2 border rounded-md text-gray-900 bg-gray-90 text-[14px]" readOnly={!isEditing} onChange={handleChange}>{profile?.bio}</textarea>
                                </div>
                            )}
                            <div>
                                <label className="text-[12px] font-bold text-gray-700">Joined On</label>
                                <input type="text" value={new Date(data.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} className="w-full p-2 border rounded-md text-gray-900 bg-gray-90 text-[14px]" readOnly />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-gray-700">Social Link</label>
                                {profile?.social_link ? (
                                    <div className="flex items-center space-x-2">
                                        {getSocialIcon(profile.social_link)}
                                        <input type="text" name="social_link" value={profile.social_link} className="w-full p-2 border rounded-md text-gray-900 bg-gray-90 text-[14px]" readOnly={!isEditing} onChange={handleChange} />
                                        {isEditing && (
                                            <button className="bg-red-500 text-white p-1 rounded" onClick={() => setProfile({ ...profile, social_link: "" })}>
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <button className="bg-blue-500 text-white p-1 rounded" onClick={() => setIsAddingLink(true)}>
                                        <Plus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">Failed to load profile</p>
                )}
                <div className="flex justify-between w-full mt-4">
                    <Button variant="outline" className="text-gray-700 border-gray-400 hover:bg-gray-200">
                        Close
                    </Button>
                    <div className="flex space-x-2 ml-auto">
                        <Button variant="outline" className="text-gray-700 border-gray-400 hover:bg-gray-200" onClick={() => setIsEditing(!isEditing)}>
                            Edit
                        </Button>
                        <Button variant="outline" className="text-gray-700 border-gray-400 hover:bg-gray-200">
                            Save
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileModal;