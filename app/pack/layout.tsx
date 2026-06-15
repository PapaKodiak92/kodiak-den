import RequireAuth from "../../components/RequireAuth";

export default function PackLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
