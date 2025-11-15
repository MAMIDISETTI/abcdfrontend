import React, { useContext, useEffect, useState } from "react";
import { SIDE_MENU_DATA, SIDE_MENU_USER_DATA, SIDE_MENU_TRAINER_DATA, SIDE_MENU_TRAINEE_DATA, SIDE_MENU_MASTER_TRAINER_DATA, SIDE_MENU_BOA_DATA, SIDE_MENU_ADMIN_DATA } from "../../utils/data";
import { UserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import Cookies from "js-cookie";

const SideMenu = ({ activeMenu, onMenuClick }) => {
    const { user, clearUser } = useContext(UserContext);
  const [sideMenuData, setSideMenuData] = useState([]);
  const [expandedMenus, setExpandedMenus] = useState({});

  const navigate = useNavigate();

  const handleClick = (route, isSubmenu = false) => {
    
    if (route === "logout") {
      handelLogout();
      return;
    }

    // Keep Plan & Progress dropdown open for Master Trainer when navigating to submenu items
    if (isSubmenu && user?.role === 'master_trainer' && 
        (route.includes('/master-trainer/day-plans') || 
         route.includes('/master-trainer/observations') || 
         route.includes('/master-trainer/assignments'))) {
      setExpandedMenus(prev => ({
        ...prev,
        "mt03": true
      }));
    }

    navigate(route);
    
    // Close sidebar on mobile after navigation (only for main menu items, not submenu)
    if (onMenuClick && !isSubmenu) {
      onMenuClick();
    }
  };

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => {
      const newState = {
        ...prev,
        [menuId]: !prev[menuId]
      };
      return newState;
    });
  };

  const handelLogout = () => {
    // Clear all cookies
    Cookies.remove("token");
    // Clear any other cookies if needed
    // Cookies.remove("otherCookieName");
    
    clearUser();
    navigate("/login");
  };

  useEffect(() => {
    if(user){
      if (user.role === 'admin') {
        setSideMenuData(SIDE_MENU_ADMIN_DATA);
      } else if (user.role === 'trainer') {
        setSideMenuData(SIDE_MENU_TRAINER_DATA);
      } else if (user.role === 'trainee') {
        setSideMenuData(SIDE_MENU_TRAINEE_DATA);
      } else if (user.role === 'master_trainer') {
        setSideMenuData(SIDE_MENU_MASTER_TRAINER_DATA);
      } else if (user.role === 'boa') {
        setSideMenuData(SIDE_MENU_BOA_DATA);
      } else {
        setSideMenuData(SIDE_MENU_USER_DATA);
      }
    }
    return () => {};
  }, [user]);

  // Keep dropdowns open when navigating to their submenu items
  useEffect(() => {
    
    // Plan & Progress dropdown (Master Trainer only)
    if (activeMenu === "Day Plans" || activeMenu === "Observations" || activeMenu === "Assignments" || 
        activeMenu === "Manage Tasks" || activeMenu === "Create Task") {
      if (user?.role === 'master_trainer') {
        setExpandedMenus(prev => {
          const newState = {
            ...prev,
            "mt03": true // Plan & Progress menu ID for Master Trainer
          };
          return newState;
        });
      }
    }
  }, [activeMenu, user?.role]);
  return <div className="w-64 h-[calc(100vh-50px)] bg-white border-r border-gray-200/50 lg:sticky lg:top-[61px] z-20 overflow-y-auto">
      <div className="flex flex-col items-center justify-center mb-7 pt-5">
        <div className="relative">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="Profile Image"
              className="w-20 h-20 bg-slate-400 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 bg-slate-400 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>

        {user?.role === "admin" && (
          <div className="text-[10px] font-medium text-white bg-primary px-3 py-0.5 rounded mt-1">
            Admin
          </div>
        )}

        {user?.role === "master_trainer" && (
          <div className="text-[10px] font-medium text-white bg-purple-600 px-3 py-0.5 rounded mt-1">
            Master Trainer
          </div>
        )}

        {user?.role === "boa" && (
          <div className="text-[10px] font-medium text-white bg-orange-600 px-3 py-0.5 rounded mt-1">
            BOA
          </div>
        )}

        {user?.role === "trainer" && (
          <div className="text-[10px] font-medium text-white bg-blue-600 px-3 py-0.5 rounded mt-1">
            Trainer
          </div>
        )}

        {user?.role === "trainee" && (
          <div className="text-[10px] font-medium text-white bg-green-600 px-3 py-0.5 rounded mt-1">
            Trainee
          </div>
        )}

        <h5 className="text-gray-950 font-medium leading-6 mt-3">
          {user?.name || ""}
        </h5>

        <p className="text-[12px] text-gray-500">{user?.email || ""}</p>
      </div>

      {sideMenuData.map((item, index) => (
        <div key={`menu_${index}`}>
          {item.hasSubmenu ? (
            <div>
              <button
                className={`w-full flex items-center justify-between text-[15px] cursor-pointer ${
                  activeMenu == item.label
                    ? "text-primary bg-linear-to-r from-blue-50/40 to-blue-100/50 border-r-3"
                    : ""
                } py-3 px-6 mb-3 cursor-pointer`}
                onClick={() => toggleSubmenu(item.id)}
              >
                <div className="flex items-center gap-4">
                  <item.icon className="text-xl" />
                  {item.label}
                </div>
                {expandedMenus[item.id] ? (
                  <LuChevronDown className="text-lg" />
                ) : (
                  <LuChevronRight className="text-lg" />
                )}
              </button>
              
              {expandedMenus[item.id] && (
                <div className="ml-6 space-y-1">
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      className={`w-full flex items-center gap-4 text-[14px] ${
                        activeMenu == subItem.label
                          ? "text-primary bg-blue-50/40 border-r-2 border-primary"
                          : "text-gray-600 hover:text-gray-900"
                      } py-2 px-4 mb-1 cursor-pointer rounded-md hover:bg-gray-50`}
                      onClick={() => handleClick(subItem.path, true)}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
                      className={`w-full flex items-center gap-4 text-[15px] cursor-pointer ${
                activeMenu == item.label
                  ? "text-primary bg-linear-to-r from-blue-50/40 to-blue-100/50 border-r-3"
                  : ""
              } py-3 px-6 mb-3 cursor-pointer`}
              onClick={() => handleClick(item.path)}
            >
              <item.icon className="text-xl" />
              {item.label}
            </button>
          )}
        </div>
      ))}
    </div>;
};

export default SideMenu;
