import * as Location from 'expo-location';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from './firebase';

let locationSubscription = null;

// Track user location and sync to Firestore
export const startTracking = async (groupId, userId, onLocationUpdate) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      return false;
    }

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000, 
        distanceInterval: 5, 
      },
      async (location) => { // Added async here
        const { latitude, longitude } = location.coords;
        
        // Inject console log for broadcasting coordinates
        console.log(`📍 [LocationSync] Broadcasting coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

        try {
          // Update Firebase
          const userRef = doc(db, `groups/${groupId}/users`, userId);
          await setDoc(userRef, { // Added await
            userId,
            lat: latitude,
            lng: longitude,
            timestamp: Date.now(),
          }, { merge: true });
          
          // Call onLocationUpdate after successful Firebase sync
          if (onLocationUpdate) onLocationUpdate(location.coords); // Changed argument to location.coords
        } catch (error) {
          console.error("🔥 [LocationSync Error] Firebase write failed:", error);
        }
      }
    );

    return true;
  } catch (error) {
    console.error("Error starting location tracking:", error);
    return false;
  }
};

export const stopTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
};

// Listen to users in a group
export const listenToGroupUsers = (groupId, onUsersUpdate) => { // Changed onUpdate to onUsersUpdate
  const groupRef = collection(db, 'groups', groupId, 'users'); // Changed usersRef to groupRef and path construction
  
  console.log(`🎧 [FirebaseSync] Listening to group: ${groupId}`); // Added console log
  const unsubscribe = onSnapshot(groupRef, (snapshot) => {
    const users = {};
    let userCount = 0; // Added userCount
    snapshot.forEach((doc) => {
      users[doc.id] = doc.data();
      userCount++; // Increment userCount
    });
    console.log(`📊 [FirebaseSync] Group ${groupId} received updates for ${userCount} users`); // Added console log
    onUsersUpdate(users); // Changed onUpdate to onUsersUpdate
  }, (error) => {
    console.error("Error listening to group users:", error);
  });
  
  return unsubscribe;
};
