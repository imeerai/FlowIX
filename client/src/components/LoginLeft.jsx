import Logo from "./logo.jsx";
import NeatGradientBackground from "./NeatGradientBackground.jsx";

const LoginLeft = () => {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-[40%] flex-col justify-between p-12 shrink-0 select-none">
      <NeatGradientBackground className="pointer-events-none absolute inset-0 z-0 h-full w-full" />
      <div className="relative z-10 flex items-center gap-3 mb-12">
        <Logo />
      </div>
      <div className="relative z-10">
        <h2 className="text-white text-3xl font-medium leading-snug mb-3 tracking-tight">
          Build your presence on web
        </h2>
        <p className="text-zinc-300">
          Create a stunning online presence with our easy-to-use platform. Bring
          your ideas to life, customize every detail, and launch beautiful,
          modern websites in less time with the power of AI.
        </p>
        <p className="text-zinc-300 text-sm mt-12">
          Copyright {new Date().getFullYear()} FlowIX. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginLeft;
