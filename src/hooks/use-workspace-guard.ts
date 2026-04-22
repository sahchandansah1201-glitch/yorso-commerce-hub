import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";

/**
 * Защищает /workspace/*. Если сессии нет — редирект на /signin?redirect=<path>.
 */
export const useWorkspaceGuard = () => {
  const { isSignedIn } = useBuyerSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isSignedIn) {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/signin?redirect=${redirect}`, { replace: true });
    }
  }, [isSignedIn, location.pathname, location.search, navigate]);

  return { isSignedIn };
};
