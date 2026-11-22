import { TafsirSheet } from '@/screens/tafsir-sheet';
import { useAppStore } from '@/store/app-store';

export default function TafsirScreen() {
  // Remount when the riwayah changes: every text lookup reads the active one.
  const riwayah = useAppStore((s) => s.riwayah);
  return <TafsirSheet key={riwayah} />;
}
