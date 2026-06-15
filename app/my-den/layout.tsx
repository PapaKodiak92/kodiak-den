import RequireAuth from "../../components/RequireAuth";

export default function MyDenLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
