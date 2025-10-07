import React, { useContext, useState } from "react";
import AuthLayout from "../../components/layouts/AuthLayout";
import { validateEmail } from "../../utils/helper";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import Input from "../../components/Inputs/Input";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";
import uploadImage from "../../utils/uploadImage";
import { LuLoader } from "react-icons/lu";

const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminInviteToken, setAdminInviteToken] = useState("");

  // Additional fields are now automatically populated

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {updateUser} = useContext(UserContext)
  const navigate = useNavigate();

  // Handle success - redirect to login
  const handleGoToLogin = () => {
    navigate("/login");
  };

  // Handle SignUp Form Submit
  const handleSignUp = async (e) => {
    e.preventDefault();

    let profileImageUrl = null

    if (!fullName) {
      setError("Please enter full name.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    setError("");
    setIsLoading(true);

    //SignUp API Call
    try {
      // Upload image if present
      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic);
        profileImageUrl = imgUploadRes?.imageUrl || null;
      }

      const requestData = {
        name: fullName,
        email,
        password,
        profileImageUrl,
        adminInviteToken: adminInviteToken || undefined
      };

      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, requestData);

      const { role } = response.data;

      // Show success message instead of redirecting
      setSuccess(true);
      setSuccessMessage(`You have successfully registered as a ${role.replace('_', ' ').toUpperCase()}! You can now login with your credentials.`);
      
      // Clear form
      setFullName("");
      setEmail("");
      setPassword("");
      setAdminInviteToken("");
      setProfilePic(null);
      setError(null);
    } catch (error){
      console.error('=== SIGNUP ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      if (error.response && error.response.data) {
        console.error('Error data:', error.response.data);
        setError(error.response.data.message || 'Registration failed');
      } else {
        console.error('No response data available');
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-[100%] h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center">
        {success ? (
          // Success Message
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-green-800 mb-2">Registration Successful!</h3>
              <p className="text-sm text-gray-600 mb-6">{successMessage}</p>
            </div>
            
            <button 
              onClick={handleGoToLogin}
              className="btn-primary w-full cursor-pointer"
            >
              Go to Login
            </button>
            
            <p className="text-[13px] text-slate-800 mt-4">
              Want to register another account?{" "}
              <button 
                onClick={() => {
                  setSuccess(false);
                  setSuccessMessage("");
                }}
                className="font-medium text-primary underline"
              >
                Register Again
              </button>
            </p>
          </div>
        ) : (
          // Registration Form
          <>
            <h3 className="text-xl font-semibold text-black">Create an Account</h3>
            <p className="text-xs text-slate-700 mt-[5px] mb-6">
              Join us today by entering your details below.
            </p>

            <form onSubmit={handleSignUp}>
              <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={fullName}
                  onChange={({ target }) => setFullName(target.value)}
                  label="Full Name"
                  placeholder="Enter your full name"
                  type="text"
                />

                <Input
                  value={email}
                  onChange={({ target }) => setEmail(target.value)}
                  label="Email Address"
                  placeholder="enter@example.com"
                  type="text"
                />

                <Input
                  value={password}
                  onChange={({ target }) => setPassword(target.value)}
                  label="Password"
                  placeholder="Min 8 Characters"
                  type="password"
                />

                <Input
                  value={adminInviteToken}
                  onChange={({ target }) => setAdminInviteToken(target.value)}
                  label="Invite Code (Master/Trainer/Trainee)"
                  placeholder="Enter invite code if provided"
                  type="text"
                />
              </div>

              {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

              <button 
                type="submit"
                disabled={isLoading}
                className={`btn-primary flex items-center justify-center gap-2 ${
                  isLoading 
                    ? 'opacity-75 cursor-not-allowed' 
                    : 'cursor-pointer'
                }`}
              >
                {isLoading && <LuLoader className="w-5 h-5 animate-spin" />}
                {isLoading ? 'Creating Account...' : 'SIGN UP'}
              </button>

              <p className="text-[13px] text-slate-800 mt-3">
                Already an account?{" "}
                <Link className="font-medium text-primary underline cursor-pointer" to="/login">
                  Login
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default SignUp;
