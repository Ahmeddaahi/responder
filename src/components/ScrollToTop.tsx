import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applySEOForRoute } from "@/lib/seo";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
        applySEOForRoute(pathname);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
