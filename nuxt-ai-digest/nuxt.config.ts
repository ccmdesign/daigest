// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt'],
  srcDir: 'app/',
  css: ['~/assets/css/main.css'],
  components: [{
    path: '~/components',
    pathPrefix: false,
    extensions: ['vue'],
  }],
})
