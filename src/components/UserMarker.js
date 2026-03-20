import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

export default function UserMarker({ user, isCurrentUser }) {
  // If the user's timestamp is > 10s old, we consider them offline
  const isOffline = (Date.now() - user.timestamp) > 10000;
  
  const color = isCurrentUser ? '#007AFF' : '#FF3B30';
  const offlineColor = '#8E8E93';

  return (
    <Marker
      coordinate={{ latitude: user.lat, longitude: user.lng }}
      title={isCurrentUser ? "You" : user.userId}
      description={isOffline ? "Offline" : "Online"}
      zIndex={isCurrentUser ? 10 : 1}
      // Provide a flat key based on coordinates or timestamp to help React handle re-renders gracefully when positions update frequently
    >
      <View style={styles.markerContainer}>
        <View style={[styles.dot, { backgroundColor: isOffline ? offlineColor : color }]} />
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>
            {isCurrentUser ? 'You' : user.userId.split('_')[1] || 'User'}
          </Text>
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  labelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  labelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  }
});
