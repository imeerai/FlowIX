import { Navigate, Outlet } from "react-router-dom";
import { useAppContext } from "../context/AppContext.jsx";
import Loading from "../components/Loading.jsx";

/** Renders protected routes after session loading, or redirects signed-out users. */
export function AuthLayout() {
  const { user, loadingUser } = useAppContext();

  if (loadingUser) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/** Renders guest routes after session loading, or redirects signed-in users home. */
export function GuestLayout() {
  const { user, loadingUser } = useAppContext();

  if (loadingUser) {
    return <Loading />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
