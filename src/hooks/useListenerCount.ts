import { useEffect, useState } from 'react';
import { ref, onValue, onDisconnect, set, remove, push } from 'firebase/database';
import { rtdb } from '../lib/firebase';

export const useListenerCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Reference to the 'listeners' list in DB
    const listenersRef = ref(rtdb, 'listeners');

    // 1. REGISTER MY PRESENCE
    // Create a unique ID for this user session
    const myRef = push(listenersRef);

    // Set my status to true
    set(myRef, true);

    // If I close the tab or lose internet, delete me automatically
    onDisconnect(myRef).remove();

    // 2. LISTEN TO THE COUNT
    const unsubscribe = onValue(listenersRef, (snapshot) => {
      if (snapshot.exists()) {
        setCount(Object.keys(snapshot.val()).length);
      } else {
        setCount(0);
      }
    });

    // Cleanup: Remove me if I navigate away (unmount)
    return () => {
      remove(myRef);
      unsubscribe();
    };
  }, []);

  return count;
};