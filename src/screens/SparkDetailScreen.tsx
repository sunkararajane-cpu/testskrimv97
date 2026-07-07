import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SparkViewer } from '../components/SparkViewer';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getSparks } from '../lib/mock/mockServices';

/**
 * Opens a single Spark directly by ID — reached by tapping a "Spark" bubble
 * shared in Connect (DM), or any other /spark/:sparkId deep link. Builds a
 * one-item groupedSparks array so the existing SparkViewer can render it
 * without needing to be inside the Pulse feed.
 */
export default function SparkDetailScreen() {
  const { sparkId } = useParams<{ sparkId: string }>();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [group, setGroup] = useState<any[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    getSparks().then((all) => {
      if (!active) return;
      const spark = all.find((s: any) => s.id === sparkId);
      if (!spark) {
        setNotFound(true);
        return;
      }
      let viewedSet = new Set<string>();
      try {
        viewedSet = new Set(JSON.parse(localStorage.getItem('skrimchat_viewed_sparks') || '[]'));
      } catch {}
      setGroup([
        {
          id: spark.user?.id || spark.user?.username || 'unknown',
          userId: spark.user?.id || spark.user?.username || 'unknown',
          user: spark.user,
          isOwn: !!spark.isOwn,
          sparks: [{ ...spark, hasViewed: spark.hasViewed || viewedSet.has(spark.id) }],
          maxEnergy: spark.energy,
          hasViewed: spark.hasViewed || viewedSet.has(spark.id),
          energy: spark.energy || 'COLD',
          expiresAt: spark.expiresAt || 0,
        },
      ]);
    });
    return () => { active = false; };
  }, [sparkId]);

  const handleSparkViewed = (id: string) => {
    try {
      const viewed = new Set(JSON.parse(localStorage.getItem('skrimchat_viewed_sparks') || '[]'));
      viewed.add(id);
      localStorage.setItem('skrimchat_viewed_sparks', JSON.stringify([...viewed]));
    } catch {}
  };

  if (notFound) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white gap-4 p-6 text-center">
        <span className="text-5xl">⚡</span>
        <h2 className="text-lg font-bold">This Spark has expired</h2>
        <p className="text-sm text-gray-400 max-w-xs">Sparks disappear 24 hours after they're posted.</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-neon-purple text-white font-bold rounded-xl text-sm mt-2">
          Back to Pulse
        </button>
      </div>
    );
  }

  if (!group) {
    return <div className="w-full h-full bg-black" />;
  }

  return (
    <SparkViewer
      groupedSparks={group}
      initialUserIndex={0}
      onClose={() => navigate(-1)}
      currentUser={currentUser}
      onSparkViewed={handleSparkViewed}
    />
  );
}
