import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-[#1E1E1E]">
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
} 