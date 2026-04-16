import Hero from "./components/sections/Hero";
import HowItWorks from "./components/sections/HowItWorks";
import Footer from "./components/ui/Footer";

function Divider() {
  return (
    <div aria-hidden className="mx-auto max-w-5xl px-6">
      <div className="h-px bg-gradient-to-r from-transparent via-[--border-strong] to-transparent" />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Divider />
      <HowItWorks />
      <Divider />
      <Footer />
    </>
  );
}
