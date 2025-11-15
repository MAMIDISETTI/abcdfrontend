import React, { useContext, useState } from "react";
import AuthLayout from "../../components/layouts/AuthLayout";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Inputs/Input";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";
import { LuLoader } from "react-icons/lu";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clear error when user starts typing
  const clearError = () => {
    if (error) {
      setError(null);
    }
  };

  const {updateUser} = useContext(UserContext)
  const navigate = useNavigate();

  // Handle Login Form Submit
  const handleLogin = async (e) => {
    e.preventDefault();

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

    //Login API Call
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, role } = response.data;

      if (token) {
        updateUser(response.data)

        //Redirect based on role
        if (role === "master_trainer") {
          navigate("/master-trainer/dashboard");
        } else if (role === "boa") {
          navigate("/boa/dashboard");
        } else if (role === "trainer") {
          navigate("/trainer/dashboard");
        } else if (role === "trainee") {
          navigate("/trainee/dashboard");
        } else if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      }
    } catch (error){
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else if (error.response && error.response.status === 401) {
        setError("Invalid email or password");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
<AuthLayout>
  <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
    <p className="text-lg font-medium text-gray-600 mt-2 mb-8">
      Please enter your credentials to continue
    </p>

    <form onSubmit={handleLogin} className="space-y-5">
      {/* Email Input */}
      <Input
        value={email}
        onChange={({ target }) => {
          setEmail(target.value);
          clearError();
        }}
        label="Email Address"
        placeholder="you@example.com"
        type="text"
        className="rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />

      {/* Password Input */}
      <Input
        value={password}
        onChange={({ target }) => {
          setPassword(target.value);
          clearError();
        }}
        label="Password"
        placeholder="••••••••"
        type="password"
        className="rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      {/* Login Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 
                   text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                     isLoading 
                       ? 'opacity-75 cursor-not-allowed' 
                       : 'cursor-pointer'
                   }`}
      >
        {isLoading && <LuLoader className="w-5 h-5 animate-spin" />}
        {isLoading ? 'Logging in...' : 'LOGIN'}
      </button>

      {/* Signup Link */}
      {/* <p className="text-sm text-gray-700 mt-5 text-center">
        Don’t have an account?
        <Link
          className="font-semibold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
          to="/signup"
        >
          Sign Up
        </Link>
      </p> */}
    </form>
  </div>
</AuthLayout>

  );
};

export default Login;
