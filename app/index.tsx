import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { getToken } from '@/services/restaurant';

export default function Index() {
  const [target, setTarget] = useState<'/login' | '/tables' | null>(null);

  useEffect(() => {
    getToken().then(token => {
      setTarget(token ? '/tables' : '/login');
    });
  }, []);

  if (!target) return null; // holds on splash while token is being checked
  return <Redirect href={target as any} />;
}