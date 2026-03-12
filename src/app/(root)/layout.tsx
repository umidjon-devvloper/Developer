import Navbar from "@/ui/navbar";
function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
export default RootLayout;
