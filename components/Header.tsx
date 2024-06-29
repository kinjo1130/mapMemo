import React, { useState } from "react";
import { LogOut, X, MessageCircle } from "lucide-react";
import { Profile } from "@line/bot-sdk";

interface HeaderProps {
  profile: Profile;
  logout: () => void;
}

const ProfileDetail: React.FC<{ profile: Profile; onClose: () => void; logout: () => void }> = ({ profile, onClose, logout }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">プロフィール詳細</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col items-center mb-4">
          <img
            src={profile.pictureUrl || "/api/placeholder/100/100"}
            alt={profile.displayName}
            className="w-24 h-24 rounded-full mb-2"
          />
          <h3 className="text-xl font-semibold text-gray-800">{profile.displayName}</h3>
        </div>
        <div className="space-y-2">
          {profile.statusMessage && (
            <p className="flex items-center text-gray-600">
              <MessageCircle size={18} className="mr-2" />
              <span>ステータス: {profile.statusMessage}</span>
            </p>
          )}
        </div>
        <div className="mt-6">
          <button
            onClick={logout}
            className="w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-300 flex items-center justify-center"
          >
            <LogOut size={18} className="mr-2" />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ profile, logout }) => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Map Memo</h1>
          </div>
          <div className="flex items-center">
            {profile.pictureUrl && (
              <button
                onClick={() => setShowProfile(true)}
                className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-full"
              >
                <img
                  src={profile.pictureUrl}
                  alt={profile.displayName}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
              </button>
            )}
          </div>
        </div>
      </header>
      {showProfile && (
        <ProfileDetail profile={profile} onClose={() => setShowProfile(false)} logout={logout} />
      )}
    </>
  );
};

export default Header;