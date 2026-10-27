import { createApp } from "vue";
import { Button, Form, Input, Select, DatePicker } from "ant-design-vue";
import "ant-design-vue/dist/reset.css";
import App from "./demo/App.vue";
const app = createApp(App);
for (const component of [Button, Form, Input, Select, DatePicker])
  app.use(component);
app.mount("#app");
