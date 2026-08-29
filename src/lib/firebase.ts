import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCxomNeXtomvT1vxZCOW6L7sute4gwiHaI",
  authDomain: "gen-lang-client-0060628781.firebaseapp.com",
  projectId: "gen-lang-client-0060628781",
  storageBucket: "gen-lang-client-0060628781.firebasestorage.app",
  messagingSenderId: "284616940624",
  appId: "1:284616940624:web:d7561c36a710f3fd61c555"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-bunnysgymrecord-e7a85bd6-a1d7-48db-b41b-56361d835c33");
export const storage = getStorage(app);

