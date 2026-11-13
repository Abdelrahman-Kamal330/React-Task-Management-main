import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProjectPage = () => {
  const { user } = useAuth();
  const { id } = useParams();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <h1>Project {id}</h1>;
};

export default ProjectPage;
