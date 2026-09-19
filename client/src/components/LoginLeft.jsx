import React from "react";

const LoginLeft = () => {
  return (
    <div className="hidden lg:flex lg:w-[40%] bg-[url('/bg-img.png')] bg-cover bg-center bg-no-repeat flex-col justify-between p-12 shrink-0 select-none">
      <div className="flex items-center gap-3 mb-12">
        <img src="/logo.png" alt="Logo" className="size-9.5" />
        <span
          className="text-4xl tracking-[-0.06em]"
          style={{ fontFamily: "system-ui" }}
        >
          <span className="text-white">Flow</span>
          <span className="text-[#ff6b1a] ml-[4px]" style={{ fontWeight: 600 }}>
            IX
          </span>
        </span>
      </div>
      <div>
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
