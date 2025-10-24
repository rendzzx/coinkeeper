import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";

type HeaderProps = {
  title: string;
  children?: ReactNode;
};

export function Header({ title, children }: HeaderProps) {
  const { setPageTitle } = useAppContext();

  useEffect(() => {
    setPageTitle(title);
  }, [title, setPageTitle]);
  
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-3xl font-bold font-headline text-primary">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
