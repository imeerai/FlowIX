import { useEffect, useRef } from "react";
import { useAppContext } from "../context/AppContext.jsx";
import NeatGradientBackground from "../components/NeatGradientBackground.jsx";
import PromptInput from "../components/PromptInput.jsx";
import { homeTags } from "../assets/assets.js";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, Trash2 } from "lucide-react";
import moment from "moment";

/** Renders the home page placeholder. */
function HomePage() {
  const scrollContainerRef = useRef(null);

  const {
    user,
    projects,
    loadingProjects,
    generatingProject,
    loadProjects,
    handleGenerate,
    cancelRequest,
    handleDelete,
    logout,
  } = useAppContext();

  useEffect(() => {
    loadProjects();
  }, [loadProjects, user]);

  return (
    <div
      ref={scrollContainerRef}
      className="relative h-screen overflow-y-scroll text-white font-sans"
    >
      <NeatGradientBackground scrollContainerRef={scrollContainerRef} />
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="size-6" />
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: "system-ui" }}
          >
            <span className="text-white">Flow</span>
            <span className="text-[#ff6b1a] ml-1" style={{ fontWeight: 600 }}>
              IX
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-zinc-300">
          <span>
            {user?.name
              ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
              : "Guest"}
          </span>{" "}
          <button
            type="button"
            onClick={logout}
            className="py-1.5 px-3 border border-white/20 text-white hover:bg-white/10 text-xs rounded-md cursor-pointer bg-transparent"
          >
            Sign Out
          </button>
        </div>
      </nav>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 mt-8 xl:mt-28">
        <div className="w-full max-w-2xl flex flex-col items-center">
          {/* Promo badge */}
          <div className="flex items-center gap-2 p-1.5 pr-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[13px] text-white/90">
            <span className="px-3 py-1 text-[11px] bg-red-700 rounded-full font-medium tracking-wider">
              PROMO
            </span>
            <span>Create your first project for free</span>
          </div>
          {/* title */}
          <h1 className="text-center text-4xl md:text-6xl font-medium mt-4 max-w-2xl text-white">
            Let's build Your app together.
          </h1>
          <p className="text-center text-sm md:text-base max-w-xl mt-4 text-white/65 leading-relaxed">
            Describe your idea and watch AI design, structure and launch your
            website instantly. No coding required.
          </p>
          {/* prompt input with glassmorphic effect */}
          <div className="w-full mt-6">
            <PromptInput
              onSubmit={handleGenerate}
              onCancel={cancelRequest}
              loading={generatingProject}
              placeholder="Create a Portfolio Website..."
              variant="glass"
              autofocus
            />
          </div>
          {/* Scrolling marquee tag */}
          <div className="masked-marquee w-full mt-4 max-w-2xl overflow-hidden py-1">
            <div className=" animate-marquee gap-3">
              {homeTags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => handleGenerate(tag)}
                  disabled={generatingProject}
                  className="px-3 py-1.5 border rounded-full text-sm text-white bg-white/10 border-white/25 hover:bg-white/20 transition cursor-pointer shrink-0 font-medium"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Projects list */}
          {!loadingProjects && projects.length > 0 && (
            <div className="mt-12 w-full">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <p className="text-xs font-medium uppercase text-zinc-100 tracking-widest">
                  All Projects{" "}
                </p>
                <span className="text-xs text-zinc-100 font-normal">
                  {projects.length}{" "}
                  {projects.length === 1 ? "project" : "projects"}
                </span>
              </div>

              <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-1">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between gap-4 group hover:border-white/20 hover:bg-white/10 cursor-pointer backdrop-blur-md transition-all"
                  >
                    <Link
                      to={`/builder/${project._id}`}
                      className="flex min-w-0 flex-1 items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {project.name}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-zinc-300 flex items-center gap-1">
                            <Clock3 size={10} />
                            {moment(
                              project.updatedAt || project.createdAt,
                            ).fromNow()}
                          </span>
                          <span className="text-xs text-white/60 font-medium">
                            v{project.version}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-zinc-200 group-hover:text-white"
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(project._id)}
                      aria-label={`Delete ${project.name}`}
                      className="p-1.5 rounded-md text-zinc-200 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
