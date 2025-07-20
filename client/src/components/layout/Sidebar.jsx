import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  HomeIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  UserCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const Sidebar = ({ isMobileSidebarOpen, toggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };
  const navItems = [
    {
      name: "Home",
      path: "/",
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      name: "History",
      path: "/history",
      icon: <ClockIcon className="w-5 h-5" />,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: <ChartBarIcon className="w-5 h-5" />,
    },
    {
      name: "About Us",
      path: "/about",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleMobileSidebar}
        ></div>
      )}{" "}
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full transition-all duration-300 transform 
                  bg-gradient-to-b from-sky-900 via-blue-800 to-indigo-900 dark:from-dark-bg dark:via-dark-card dark:to-gray-900 text-white 
                  w-64 lg:translate-x-0 shadow-xl ${
                    isMobileSidebarOpen
                      ? "translate-x-0"
                      : "-translate-x-full lg:translate-x-0"
                  }`}
      >
        {/* Close button for mobile */}
        <button
          onClick={toggleMobileSidebar}
          className="absolute top-4 right-4 lg:hidden text-sky-400 hover:text-sky-300 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>{" "}
        {/* Sidebar header */}
        <div className="p-5 border-b border-blue-700 dark:border-dark-border bg-gradient-to-r from-sky-600 to-blue-600 dark:from-dark-card dark:to-gray-800">
          <Link to="/" className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-white">APS</span>
            <span className="text-sm font-medium text-white">
              Amazon Product Synthesis
            </span>
          </Link>
        </div>
        {/* User profile section */}
        <div className="p-5 border-b border-blue-700 dark:border-dark-border bg-blue-800 dark:bg-dark-card">
          <div className="flex items-center space-x-3">
            <UserCircleIcon className="w-10 h-10 text-sky-400 dark:text-dark-accent" />{" "}
            <div>
              <p className="font-medium text-white">{user?.name || "Guest"}</p>
              <p className="text-xs text-blue-300 dark:text-gray-400">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>{" "}
        {/* Navigation links */}
        <nav className="p-5 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                        ${
                          isActive(item.path)
                            ? "bg-blue-600 text-white font-medium shadow-md transform scale-105"
                            : "text-blue-200 hover:bg-blue-700 hover:text-sky-300 hover:translate-x-1"
                        }`}
            >
              <span
                className={`${
                  isActive(item.path) ? "text-white" : "text-sky-400"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        {/* Settings and logout */}
        <div className="absolute bottom-0 w-full p-5 border-t border-blue-700 bg-blue-800">
          <Link
            to="/settings"
            className="flex items-center space-x-3 p-3 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-sky-300 transition-all duration-200 hover:translate-x-1"
          >
            <Cog6ToothIcon className="w-5 h-5 text-sky-400" />
            <span>Settings</span>
          </Link>{" "}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-3 p-3 mt-3 rounded-lg 
                      bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium transition-all duration-200 hover:shadow-lg"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
