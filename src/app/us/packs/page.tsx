import { redirect } from 'next/navigation';
import { PackPicker } from '@/components/play/PackPicker';
import { currentPlayer } from '@/lib/http/player-session';
import { PACKS, questionsIn } from '@/lib/questions/packs';

export const metadata = { title: 'Packs' };

export default async function PacksPage() {
  const ctx = await currentPlayer();
  if (!ctx) redirect('/');
  const rows = PACKS.map((p) => ({ id: p.id, title: p.title, blurb: p.blurb, count: questionsIn(p.id).length }));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-display display">Question packs</h1>
        <p className="text-secondary">Choose where your daily question comes from. It changes from the next question, for both of you.</p>
      </div>
      <PackPicker packs={rows} current={ctx.couple.packId} />
    </div>
  );
}
