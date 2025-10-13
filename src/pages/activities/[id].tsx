import { useRouter } from 'next/router';
import ProjectItemDetail from '../../components/projects/ProjectItemDetail';

export default function ActivityDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!router.isReady) return <div>Loading...</div>;
  if (!id || typeof id !== 'string') {
    return <div>Invalid activity ID</div>;
  }
  const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
  if (!isValidObjectId) {
    return <div>Invalid activity ID</div>;
  }

  return <ProjectItemDetail id={id} type="activity" />;
}