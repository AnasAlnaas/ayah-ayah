import { Settings } from '@/screens/settings';
import { useAppStore } from '@/store/app-store';

export default function SettingsScreen() {
  // Remount when the riwayah changes: every text lookup reads the active one.
  const riwayah = useAppStore((s) => s.riwayah);
  return <Settings key={riwayah} />;
}
