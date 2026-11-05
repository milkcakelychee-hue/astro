import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import { execSync } from 'node:child_process'
import pkg from './package.json' with { type: 'json' }

// เวอร์ชันที่แสดงในหน้าตั้งค่า = version ใน package.json + commit
let commit = ''
try { commit = execSync('git rev-parse --short HEAD').toString().trim() } catch { /* ไม่มี git */ }

export default defineConfig({
  // GitHub Pages เสิร์ฟที่ /astro/ (ตั้ง BASE ใน workflow) · เครื่อง dev ใช้ /
  base: process.env.BASE ?? '/',
  define: { __APP_VERSION__: JSON.stringify(pkg.version + (commit ? ' · ' + commit : '')) },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // ไอคอนแอปยังรอผู้ใช้เลือก (ดู PROGRESS.md) — ตอนนี้ใช้ favicon.svg ชั่วคราว
      manifest: {
        name: 'ดวงของฉัน',
        short_name: 'ดวง',
        lang: 'th',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#06070D',
        theme_color: '#06070D',
        start_url: '.',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // ใช้ออฟไลน์ได้ทั้งหมด: โค้ด ฟอนต์ คลังข้อความ wasm และ ephemeris
        globPatterns: ['**/*.{js,css,html,svg,woff2,wasm,data,se1}'],
        // สำเนา .wasm ที่ Vite emit เองไม่ได้ถูกใช้ (โมดูลโหลดจาก /wasm/)
        globIgnores: ['assets/swisseph-*.wasm'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  // dev: ให้เปิดไฟล์ดีไซน์ (../design) ผ่าน /@fs/ เพื่อเทียบภาพกับหน้าจริงได้
  server: { fs: { allow: ['..'] } },
  optimizeDeps: { exclude: ['swisseph-wasm'] },
  test: { include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 60000, hookTimeout: 60000 },
})
