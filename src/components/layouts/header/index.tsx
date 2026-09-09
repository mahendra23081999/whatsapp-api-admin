"use client"

import { useAppSelector } from "@/src/redux/hooks";
import { setMobileSidebarOpen, setSidebarToggle } from "@/src/redux/reducers/layoutSlice";
import { Menu } from "lucide-react";
import { useDispatch } from "react-redux";
import LeftHeader from "./LeftHeader";
import RightHeader from "./RightHeader";
import { Button } from "@/src/elements/ui/button";

const Header = () => {
  const { sidebarToggle, isRTL, sidebarHover } = useAppSelector(state => state.layout);
  const dispatch = useDispatch();
  const isVisuallyCollapsed = sidebarToggle && !sidebarHover;

  const handleToggle = () => {
    if (window.innerWidth < 1024) {
      dispatch(setMobileSidebarOpen());
    } else {
      dispatch(setSidebarToggle());
    }
  };

  return (
    <header
      className={`
        z-[151] fixed top-0 left-0 right-0 transition-all duration-300 h-16 flex items-center border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-(--dark-body)/90 backdrop-blur-xl
        ${!isVisuallyCollapsed ? "lg:ps-76" : "lg:ps-24 ps-0"}
      `}
    >
      <div className="flex-1 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 flex-1">
          <Button
            onClick={handleToggle}
            className={`
              p-2 rounded-md transition-all duration-200
              dark:bg-page-body dark:focus-visible:outline-none dark:text-slate-400 dark:hover:text-white dark:hover:bg-(--dark-sidebar)
              bg-transparent text-slate-500 hover:text-(--text-green-primary) hover:bg-slate-100 dark:border-none dark:hover:bg-white/10
            `}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <LeftHeader />
        </div>

        <RightHeader />
      </div>
    </header>
  );
};

export default Header;
