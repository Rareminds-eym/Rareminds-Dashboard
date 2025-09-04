import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Plus, FileText, Eye, Clock } from 'lucide-react';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active section based on current route
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/new-project')) return 'new-project';
    if (path.includes('/projects/published')) return 'published';
    if (path.includes('/drafts')) return 'drafts';
    return 'overview';
  };

  const activeSection = getActiveSection();

  return (
    <div className="min-h-screen">
      
      <main className="px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default ProjectsPage;
