/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // Quét toàn bộ file trong thư mục src
  theme: {
    extend: {}, // Bạn có thể thêm các tùy chỉnh theme ở đây sau
  },
  plugins: [forms, typography], // Kích hoạt plugins
};
