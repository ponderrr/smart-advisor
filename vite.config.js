import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    root: ".",
    server: {
      open: true,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    build: {
      rollupOptions: {
        input: "index.html",
      },
      outDir: "dist",
      minify: isProduction,
      sourcemap: !isProduction,
    },
    define: {
      "process.env.VITE_MODE": JSON.stringify(mode),
    },
  };
});
