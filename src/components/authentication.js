import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

const signIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if this is a new user
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      // New user - create a new document in the 'users' collection with default systemMessageText
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        systemMessageText: "Explain all concepts like I am 10 years old.", // default systemMessageText
        createdAt: serverTimestamp(),
      });
    } else {
      // Existing user - retrieve the systemMessageText
      user.systemMessageText = docSnap.data().systemMessageText;
    }
    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    return null;
  }
};

const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export { signIn, signOut };
