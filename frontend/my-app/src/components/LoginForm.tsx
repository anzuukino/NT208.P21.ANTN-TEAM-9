"use client";
import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import { useButtonClickAlert, useLogin } from "@/app/hooks/buttonhelper";
import { useRouter } from "next/navigation";
import { checkLogin } from "@/app/hooks/helper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function LoginForm() {
  const router = useRouter();
  let [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, success } = useLogin();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const handleClick = useButtonClickAlert();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login(formData.email, formData.password);
  };

  useEffect(() => {
    if (success) {
      router.push("/");
    }
  }, [success, router]);

  useEffect(() => {
    const checkUserLogin = async () => {
      const uid = await checkLogin();
      if (uid) {
        router.push("/");
      }
    };

    checkUserLogin();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[url(../../assets/money.jpg)] bg-cover font-[inter]">
      <div className="w-full max-w-lg p-12 bg-white/40   rounded-2xl shadow-lg backdrop-blur-[12px] backdrop-saturate-171 glass" >
        <h2 className="text-3xl font-bold text-center text-gray-900">Login</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {success && <p className="text-green-500 text-center">Login successful!</p>}
        
        <p className="text-center text-gray-800 text-md mt-1 font-medium">
          Create a fund? <a href="/register" className="text-blue-600 font-semibold hover:underline">Click here to register</a>
        </p>

        <form className="mt-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-md font-semibold text-gray-900">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-700 focus:border-green-700 text-gray-900 text-lg font-medium"
            />
          </div>

          <div className="mt-4 relative">
            <label htmlFor="password" className="block text-md font-semibold text-gray-900">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-700 focus:border-green-700 text-gray-900 text-lg font-medium"
            />
            <button
              type="button"
              className="absolute right-3 top-10 text-gray-700 text-sm font-medium"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="mt-2 text-right">
            <a href="#" className="text-md text-blue-600 font-semibold hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="mt-6 w-full py-3 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-400" />
          <span className="px-3 text-gray-800 text-md font-medium">or</span>
          <hr className="flex-grow border-gray-400" />
        </div>

        <div className="space-y-3">
          <button className="flex items-center justify-center w-full py-3 border border-gray-400 rounded-lg hover:bg-gray-200 text-lg font-semibold text-gray-900" onClick={handleClick}>
            <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" alt="Google" className="w-6 h-6 mr-3" />
            Continue with Google
          </button>
          <button className="flex items-center justify-center w-full py-3 border border-gray-400 rounded-lg hover:bg-gray-200 text-lg font-semibold text-gray-900" onClick={handleClick}>
            <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" className="w-6 h-6 mr-3" />
            Continue with Facebook
          </button>
          <button className="flex items-center justify-center w-full py-3 border border-gray-400 rounded-lg hover:bg-gray-200 text-lg font-semibold text-gray-900" onClick={handleClick}>
            <img src="https://cdn-icons-png.flaticon.com/512/731/731985.png" alt="Apple" className="w-6 h-6 mr-3" />
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
}
