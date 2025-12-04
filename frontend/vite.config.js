import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react-chartjs-2',
       'chart.js/auto',
      'react-datepicker'
     
    ]
  },
   css: {
    preprocessorOptions: {
      css: {
        additionalData: `@import "react-datepicker/dist/react-datepicker.css";`
      }
    }
  }
})