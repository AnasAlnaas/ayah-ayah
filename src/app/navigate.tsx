import { NavigateSheet } from '@/screens/navigate';
import { useAppStore } from '@/store/app-store';

export default function NavigateScreen() {
  // Remount when the riwayah changes: every text lookup reads the active one.
  const riwayah = useAppStore((s) => s.riwayah);
  return <NavigateSheet key={riwayah} />;
}
