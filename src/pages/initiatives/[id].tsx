import { useRouter } from 'next/router';
import ProjectItemDetail from '../../components/projects/ProjectItemDetail';

export default function InitiativeDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!router.isReady) return <div>Loading...</div>;
  if (!id || typeof id !== 'string') {
    return <div>Invalid initiative ID</div>;
  }
  const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
  if (!isValidObjectId) {
    return <div>Invalid initiative ID</div>;
  }

  return <ProjectItemDetail id={id} type="initiative" />;
}