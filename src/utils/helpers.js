import AsyncStorage from '@react-native-async-storage/async-storage';

// Generates or retrieves a unique User ID
export const getOrCreateUserId = async () => {
  try {
    let userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 11);
      await AsyncStorage.setItem('userId', userId);
    }
    return userId;
  } catch (error) {
    console.error('Error accessing AsyncStorage:', error);
    return 'user_' + Math.random().toString(36).substring(2, 11); // Fallback
  }
};
