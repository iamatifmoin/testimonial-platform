import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/widget.js",
      name: "TestimonialWidget",
      fileName: () => "widget.js",
      formats: ["iife"]
    },
    outDir: "dist",
    minify: true,
    rollupOptions: {
      external: []
    }
  }
});
