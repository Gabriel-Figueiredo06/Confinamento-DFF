import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAu-hoi6Zwq0el3mVT9tscyYnZzGaudQz0",
  authDomain: "confinamento-dff-342cc.firebaseapp.com",
  projectId: "confinamento-dff-342cc",
  storageBucket: "confinamento-dff-342cc.firebasestorage.app",
  messagingSenderId: "379676354747",
  appId: "1:379676354747:web:bd122dd8a5cabbeff7619e"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };