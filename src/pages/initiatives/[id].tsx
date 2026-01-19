import { useRouter } from 'next/router';
import ProjectItemDetail from '../../components/projects/ProjectItemDetail';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

export default function InitiativeDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading initiative...</p>
        </div>
      </div>
    );
  }

  if (!id || typeof id !== 'string') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center p-8 max-w-md bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <FaExclamationTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid Initiative ID</h2>
          <p className="text-gray-400">The requested initiative identifier is invalid.</p>
        </div>
      </div>
    );
  }

  const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
  if (!isValidObjectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center p-8 max-w-md bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid ID Format</h2>
          <p className="text-gray-400">The initiative ID format is incorrect.</p>
        </div>
      </div>
    );
  }

  return <ProjectItemDetail id={id} type="initiative" />;
}