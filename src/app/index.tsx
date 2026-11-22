import { Home } from '@/screens/home';
import { useAppStore } from '@/store/app-store';

export default function HomeScreen() {
  // Remount when the riwayah changes: every text lookup reads the active one.
  const riwayah = useAppStore((s) => s.riwayah);
  return <Home key={riwayah} />;
}
