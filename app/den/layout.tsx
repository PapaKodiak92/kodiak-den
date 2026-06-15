import RequireAuth from "../../components/RequireAuth";

export default function DenLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
