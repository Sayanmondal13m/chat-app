self.addEventListener("install", (event) => {
    console.log("Development service worker installed.");
  });
  
  self.addEventListener("activate", (event) => {
    console.log("Development service worker activated.");
  });
  
  self.addEventListener("fetch", (event) => {
    console.log("Service worker fetch event:", event.request.url);
  });
  