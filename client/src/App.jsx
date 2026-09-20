import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import { AuthLayout, GuestLayout } from "./pages/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import BuilderPage from "./pages/BuilderPage.jsx";
import PreviewPage from "./pages/PreviewPage.jsx";
import PublishPage from "./pages/PublishPage.jsx";
import { Toaster } from "react-hot-toast";

/** Renders the route tree for guest-only and authenticated pages. */
const App = () => {
  return (
    <>
      <Toaster />
      <Routes>
        {/* login routes */}
        <Route element={<GuestLayout />}>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
        </Route>

        {/* protected  routes */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/builder/:id" element={<BuilderPage />} />
          <Route path="/preview/:id" element={<PreviewPage />} />
        </Route>

        {/* public routes */}
        <Route path="/publish/:id" element={<PublishPage />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
