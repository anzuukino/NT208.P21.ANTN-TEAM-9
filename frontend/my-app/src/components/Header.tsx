import "../app/globals.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkLogin } from "@/app/hooks/helper";

interface User {
  firstname: string;
  lastname: string;
}

interface NavbarProps {
  user: User | null;
  handleLogout: () => void;
}

export function MyNavBar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { uid } = await checkLogin();
        if (!uid) return;

        const response = await fetch(`/api/user/${uid}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData: User = await response.json();
        setUser(userData);
      } catch {
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include", // Ensures cookies are sent with request
      });
      if (!response.ok) throw new Error("Logout failed");

      setUser(null);
      router.push("/"); // Redirect to home after logout
    } catch {
      alert("Failed to log out. Please try again.");
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is defined (browser environment)
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      // Initial check
      checkMobile();

      // Set up event listener for window resize
      window.addEventListener("resize", checkMobile);

      // Clean up event listener
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="shadow-2xl text-lg">
      <nav className="sticky top-0 left-0 right-0 bg-white border-gray-200 dark:bg-gray-900 shadow-lg py-3 px-4 md:px-10 w-full">
        <div className="container mx-auto flex flex-wrap items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/file.svg" width={25} height={25} alt="logo" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-dropdown"
            aria-expanded={isOpen ? "true" : "false"}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-6 h-6"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>

          <div className="flex md:order-1 justify-between ml-48 font-[nunito]">
            {/* Desktop Navigation Links */}
            <div
              className="hidden w-full md:block md:w-auto"
              id="navbar-dropdown"
            >
              <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                <li>
                  <Link
                    href="/about"
                    className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-green-700 hover:text-white md:hover:bg-transparent md:hover:text-green-700 md:p-0 dark:text-white md:dark:hover:text-green-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/donate"
                    className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-green-700 hover:text-white md:hover:bg-transparent md:hover:text-green-700 md:p-0 dark:text-white md:dark:hover:text-green-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Donate
                  </Link>
                </li>
                <li>
                  <Link
                    href="/createfund"
                    className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-green-700 hover:text-white md:hover:bg-transparent md:hover:text-green-700 md:p-0 dark:text-white md:dark:hover:text-green-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Fundraise
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Auth Buttons - Always visible on both mobile and desktop */}
          <div className="flex items-center md:order-2 space-x-2 md:space-x-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:bg-green-700 hover:text-white px-2 md:px-3 py-1 rounded-lg text-sm md:text-base"
                >
                  {user.firstname} {user.lastname}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white bg-red-600 hover:bg-red-800 px-2 md:px-3 py-1 rounded-lg text-lg md:text-base"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:bg-green-700 hover:text-white px-2 md:px-3 py-1 rounded-lg text-lg md:text-base"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-white bg-green-600 hover:bg-green-800 px-2 md:px-3 py-1 rounded-full shadow-md shadow-green-500/50 text-lg md:text-base"
                >
                  Start your FundMe
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          className={`${isOpen ? "block" : "hidden"} md:hidden w-full`}
          id="navbar-dropdown-mobile"
        >
          <ul className="flex flex-col font-medium p-4 mt-4 border border-gray-100 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <li>
              <Link
                href="/about"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-green-700 hover:text-white dark:text-white dark:hover:bg-green-700"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/donate"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-green-700 hover:text-white dark:text-white dark:hover:bg-green-700"
                onClick={() => setIsOpen(false)}
              >
                Donate
              </Link>
            </li>
            <li>
              <Link
                href="/createfund"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-green-700 hover:text-white dark:text-white dark:hover:bg-green-700"
                onClick={() => setIsOpen(false)}
              >
                Fundraise
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    // <div className="shadow-2xl">
    //   <nav className="sticky top-0 left-0 right-0 bg-white shadow-lg py-3 pl-10 pr-10 w-full">
    //     <div className="container mx-auto flex justify-between items-center">
    //       {/* Left Side */}
    //       <div className="flex items-center space-x-6">
    //         <Link
    //           href="/about"
    //           className="text-gray-700 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg"
    //         >
    //           About
    //         </Link>
    //         <Link
    //           href="/donate"
    //           className="text-gray-700 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg"
    //         >
    //           Donate
    //         </Link>
    //         <Link
    //           href="/createfund"
    //           className="text-gray-700 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg"
    //         >
    //           Fundraise
    //         </Link>
    //       </div>

    //       {/* Logo */}
    //       <Image src="/file.svg" width={25} height={25} alt="logo" />

    //       {/* Right Side */}
    //       <div className="flex items-center space-x-6">
    //         {user ? (
    //           <>
    //             <Link
    //               href="/profile"
    //               className="text-gray-700 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg"
    //             >
    //               {user.firstname} {user.lastname}
    //             </Link>
    //             <button
    //               onClick={handleLogout}
    //               className="text-white bg-red-600 hover:bg-red-800 px-3 py-1 rounded-lg"
    //             >
    //               Logout
    //             </button>
    //           </>
    //         ) : (
    //           <>
    //             <Link
    //               href="/login"
    //               className="text-gray-700 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg"
    //             >
    //               Login
    //             </Link>
    //             <Link
    //               href="/register"
    //               className="text-white bg-green-600 hover:bg-green-800 px-3 py-1 rounded-full shadow-2xl shadow-green-500/70"
    //             >
    //               Start your FundMe
    //             </Link>
    //           </>
    //         )}
    //       </div>
    //     </div>
    //   </nav>
    // </div>
  );
}
