// Main App Component with Lazy Loading
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useStore } from "./store/useStore";
import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import GlobalSocketHandler from "./components/GlobalSocketHandler";
import Loading from "./components/Loading";

// Lazy Load Pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const PostDetails = lazy(() => import("./pages/PostDetails"));
const Saved = lazy(() => import("./pages/Saved"));
const Explore = lazy(() => import("./pages/Explore"));
const MomentMap = lazy(() => import("./components/MomentMap"));
const Rooms = lazy(() => import("./pages/Rooms"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const Messages = lazy(() => import("./pages/Messages"));
const Settings = lazy(() => import("./pages/Settings"));
const HashtagFeed = lazy(() => import("./pages/HashtagFeed"));
const VoiceRoom = lazy(() => import("./pages/VoiceRoom"));
const Sphere3D = lazy(() => import("./pages/Sphere3D"));

// Legal & Info Pages
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));

function App() {
  const { user, checkAuth } = useStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      {user && <GlobalSocketHandler />}
      {user && <Navbar />}
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={user ? <Home /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile/:id"
            element={user ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/u/:id"
            element={user ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/post/:id"
            element={user ? <PostDetails /> : <Navigate to="/login" />}
          />
          <Route
            path="/saved"
            element={user ? <Saved /> : <Navigate to="/login" />}
          />
          <Route
            path="/explore"
            element={user ? <Explore /> : <Navigate to="/login" />}
          />
          <Route
            path="/map"
            element={user ? <MomentMap /> : <Navigate to="/login" />}
          />
          <Route
            path="/sphere"
            element={user ? <Sphere3D /> : <Navigate to="/login" />}
          />
          <Route
            path="/rooms"
            element={user ? <Rooms /> : <Navigate to="/login" />}
          />
          <Route
            path="/rooms/:roomId"
            element={user ? <ChatRoom /> : <Navigate to="/login" />}
          />
          <Route
            path="/messages"
            element={user ? <Messages /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={user ? <Settings /> : <Navigate to="/login" />}
          />
          <Route
            path="/hashtag/:tag"
            element={user ? <HashtagFeed /> : <Navigate to="/login" />}
          />
          <Route
            path="/voice/:roomId"
            element={user ? <VoiceRoom /> : <Navigate to="/login" />}
          />

          {/* Public Legal/Info Pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
