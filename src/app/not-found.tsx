import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';

export default function NotFound() {
  return (
    <>
      <header className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 h-16 flex items-center">
        <Wordmark />
      </header>
      <main className="flex-1 w-full max-w-[680px] mx-auto px-4 sm:px-6 py-16 flex flex-col gap-4">
        <h1 className="text-display display">Nothing here.</h1>
        <p className="text-secondary">The link may be old, or the game it belonged to was ended.</p>
        <Link href="/" className="btn btn-primary self-start">
          Go to the start
        </Link>
      </main>
    </>
  );
}
