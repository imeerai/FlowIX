import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import Loading from "../components/Loading";
import PreviewPanel from "../components/PreviewPanel";

/** Renders a published project from its public route. */
function PublishPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadPublishedProject = async () => {
      try {
        const { data } = await api.get(`/api/projects/public/${id}`);
        if (!data?.published) {
          throw new Error("Website unavailable or not published yet");
        }
        if (!ignore) setProject(data);
      } catch (requestError) {
        console.error("Failed to load published project", requestError);
        if (!ignore) {
          setError(
            requestError?.response?.data?.error ||
              requestError.message ||
              "Website unavailable or not published yet",
          );
        }
      }
    };

    loadPublishedProject();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white px-6 text-center">
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    );
  }

  if (!project) return <Loading />;

  return (
    <div className="h-screen bg-white">
      <PreviewPanel project={project} showCode={false} readOnly />
    </div>
  );
}

export default PublishPage;
