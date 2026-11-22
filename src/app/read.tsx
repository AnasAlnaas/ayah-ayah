import { Reader } from '@/screens/reader';
import { useAppStore } from '@/store/app-store';

export default function ReadScreen() {
  // Remount when the riwayah changes: every text lookup reads the active one.
  const riwayah = useAppStore((s) => s.riwayah);
  return <Reader key={riwayah} />;
}
