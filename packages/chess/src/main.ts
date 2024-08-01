import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { createRouter, createWebHistory } from "vue-router";
const router = createRouter({
  history: createWebHistory(), //工作模式 ，还有一种是hash
  routes: [],
});
createApp(App).use(router).mount("#app");
