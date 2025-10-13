import { useRouter } from 'next/router';
import ProjectItemDetail from '../../components/projects/ProjectItemDetail';

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!router.isReady) return <div>Loading...</div>;
  if (!id || typeof id !== 'string') {
    return <div>Invalid project ID</div>;
  }
  const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
  if (!isValidObjectId) {
    return <div>Invalid project ID</div>;
  }

  return <ProjectItemDetail id={id} type="project" />;
}