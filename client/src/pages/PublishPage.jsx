import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import FullPagePreview from "../components/FullPagePreview";
import Loading from "../components/Loading";

const PublishedProject = ({ id }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;

    const fetchPublishProject = async () => {
      try {
        const { data } = await api.get(`/api/projects/public/${id}`);

        if (!data?.published) {
          throw new Error(
            "This website is not available or is not published yet.",
          );
        }

        if (active) setProject(data);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load public project", err);
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "This website is not available or is not published yet.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPublishProject();
    return () => {
      active = false;
    };
  }, [id]);

  if (id && loading) {
    return <Loading />;
  }

  if (error || !project) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-50 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
          <AlertCircle size={24} />
        </div>

        <h1 className="text-lg font-semibold text-zinc-900 mb-1.5">
          Website unavailable
        </h1>

        <p className="text-sm text-zinc-500 max-w-sm leading-relaxed mb-6">
          {error || "This website is not available or is not published yet."}
        </p>

        <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          FlowIX
        </div>
      </div>
    );
  }

  return <FullPagePreview files={project.files} />;
};

const PublishPage = () => {
  const { id } = useParams();
  return <PublishedProject key={id} id={id} />;
};

export default PublishPage;
