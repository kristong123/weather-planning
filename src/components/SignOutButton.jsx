// Sign out button component for users to sign out of their account.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function SignOutButton() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      navigate("/login");
    }
  };

  // Show user name if available
  const displayText = user?.displayName ? `${user.displayName} - Sign Out` : 'Sign Out';

  return (
    <button
      className="
        absolute w-[30vw] h-12 top-[4.75rem] right-[18%] text-[4vw] border border-gray-300 rounded-md hover:bg-gray-50 transition-colors truncate
        md:w-32 md:h-12 md:top-5 md:left-5 md:text-base
      "
      onClick={handleSignOut}
      title={displayText}
    >
      Sign Out
    </button>
  );
}

export default SignOutButton;
