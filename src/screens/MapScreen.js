import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import MapView, { Marker } from 'react-native-maps'; // Kept for iOS
import { startTracking, stopTracking, listenToGroupUsers } from '../services/locationService';
import UserMarker from '../components/UserMarker';

export default function MapScreen({ route, navigation }) {
  const { groupId, userId } = route.params;

  const [users, setUsers] = useState({});
  const [myLocation, setMyLocation] = useState(null);
  const [status, setStatus] = useState('Connecting...');

  const mapRef = useRef(null);
  const webviewRef = useRef(null);

  useEffect(() => {
    let unsubscribe = null;

    const setup = async () => {
      setStatus('Requesting location...');
      const started = await startTracking(groupId, userId, (loc) => {
        setMyLocation(loc);
        setStatus('Tracking active');
      });

      if (!started) {
        setStatus('Permission denied');
        return;
      }

      unsubscribe = listenToGroupUsers(groupId, (updatedUsers) => {
        setUsers(updatedUsers);
      });
    };

    setup();
    return () => {
      stopTracking();
      if (unsubscribe) unsubscribe();
    };
  }, [groupId, userId]);

  const [mapHtml, setMapHtml] = useState(null);

  // Push real-time updates to Leaflet HTML Map
  useEffect(() => {
    if (Platform.OS === 'android' && webviewRef.current && myLocation && mapHtml) {
      const usersArray = Object.values(users).map(u => ({
        ...u, lat: Number(u.lat), lng: Number(u.lng)
      })).filter(u => !isNaN(u.lat) && !isNaN(u.lng) && u.lat !== 0);

      webviewRef.current.injectJavaScript(`
        if (window.updateMarkers) {
          window.updateMarkers(${JSON.stringify(usersArray)}, '${userId}');
          window.centerMap(${myLocation.latitude}, ${myLocation.longitude});
        }
        true;
      `);
    }
  }, [users, myLocation, userId, mapHtml]);

  const activeUsersCount = Object.values(users).filter(
    (u) => Date.now() - u.timestamp <= 10000
  ).length;

  const centerMapOnMe = () => {
    if (myLocation) {
      if (Platform.OS === 'ios' && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: myLocation.latitude,
          longitude: myLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      } else if (Platform.OS === 'android' && webviewRef.current) {
        webviewRef.current.injectJavaScript(`
          if (window.map) window.map.setView([${myLocation.latitude}, ${myLocation.longitude}], 15);
          true;
        `);
      }
    }
  };

  const getLeafletHtml = (initialLat, initialLng) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
          .leaflet-container { background: #f5f5f5; }
          .custom-dot {
            width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
          .custom-label {
            position: absolute; top: 25px; left: -10px; background: white; padding: 4px 8px; 
            font-size: 11px; font-weight: 800; border-radius: 12px; border: 1px solid #ddd; color: #222;
            transform: translateX(-50%); white-space: nowrap; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
          }
          /* Smooth marker movement via CSS transition */
          .leaflet-marker-icon {
            transition: transform 1.2s linear !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          window.map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], 15);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(window.map);
          window.markers = {};
          
          window.centerMap = function(lat, lng) {
             window.map.panTo([lat, lng], { animate: true, duration: 1 });
          };

          window.fitUsers = function(usersArray) {
             if (usersArray.length === 0) return;
             var bounds = L.latLngBounds(usersArray.map(u => [u.lat, u.lng]));
             window.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          };

          window.updateMarkers = function(usersArray, myUserId) {
            var activeIds = new Set();
            usersArray.forEach(function(u) {
              var isOffline = (Date.now() - u.timestamp) > 10000;
              // Phase 2: Ignore users inactive for > 10s entirely from map
              if (isOffline) return;

              activeIds.add(u.userId);
              var isMe = u.userId === myUserId;
              var bgColor = isMe ? '#007AFF' : '#FF3B30';
              var name = isMe ? 'You' : (u.userId.split('_')[1] || u.userId.substring(0,4));
              
              var html = "<div class='custom-dot' style='background:" + bgColor + ";'></div>" +
                         "<div class='custom-label'>" + name + "</div>";
                         
              var icon = L.divIcon({ className: '', iconSize: [20, 20], html: html });
              
              if (window.markers[u.userId]) {
                window.markers[u.userId].setLatLng([u.lat, u.lng]);
                window.markers[u.userId].setIcon(icon);
              } else {
                window.markers[u.userId] = L.marker([u.lat, u.lng], {icon: icon}).addTo(window.map);
              }
            });

            // Cleanup disconnected users
            Object.keys(window.markers).forEach(function(id) {
              if (!activeIds.has(id)) {
                window.map.removeLayer(window.markers[id]);
                delete window.markers[id];
              }
            });
          };
        </script>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    if (myLocation && !mapHtml) {
      setMapHtml(getLeafletHtml(myLocation.latitude, myLocation.longitude));
    }
  }, [myLocation, mapHtml]);

  return (
    <SafeAreaView style={styles.container}>
      {myLocation && typeof myLocation.latitude === 'number' && (Platform.OS === 'ios' || mapHtml) ? (
        Platform.OS === 'android' ? (
          <WebView
            ref={webviewRef}
            style={StyleSheet.absoluteFillObject}
            source={{ html: mapHtml }}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: myLocation.latitude,
              longitude: myLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsCompass={true}
          >
            {Object.values(users).map((user) => {
              const lat = Number(user?.lat);
              const lng = Number(user?.lng);
              const isOffline = (Date.now() - user.timestamp) > 10000;

              // Phase 2: Skip invalid coordinates or offline users
              if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0) || isOffline) return null;

              const safeUser = { ...user, lat, lng };
              return (
                <UserMarker
                  key={safeUser.userId}
                  user={safeUser}
                  isCurrentUser={safeUser.userId === userId}
                />
              );
            })}
          </MapView>
        )
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Fetching location...</Text>
        </View>
      )}

      {/* Modern UI Top Info Card */}
      <View style={styles.topCard}>
        <View style={styles.topCardHeader}>
          <View>
            <Text style={styles.groupLabel}>GROUP</Text>
            <Text style={styles.groupText}>{groupId.toUpperCase()}</Text>
          </View>
          <View style={styles.badgeContainer}>
            <View style={[styles.statusDot, status === 'Tracking active' ? styles.statusGreen : styles.statusGray]} />
            <Text style={styles.usersText}>{activeUsersCount} Active</Text>
          </View>
        </View>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      {/* Floating Modern Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={[styles.floatingButton, styles.buttonBlue]} onPress={centerMapOnMe}>
          <Text style={styles.floatingButtonEmoji}>🎯</Text>
          <Text style={styles.floatingButtonText}>Center Me</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.floatingButton, styles.buttonRed]} onPress={() => navigation.replace('Join')}>
          <Text style={styles.floatingButtonEmoji}>🚪</Text>
          <Text style={styles.floatingButtonText}>Leave Group</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA'
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500'
  },
  topCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  topCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#999',
    letterSpacing: 1,
  },
  groupText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusGreen: {
    backgroundColor: '#34C759',
  },
  statusGray: {
    backgroundColor: '#8E8E93',
  },
  usersText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  statusText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonBlue: {
    backgroundColor: '#007AFF',
  },
  buttonRed: {
    backgroundColor: '#FF3B30',
  },
  floatingButtonEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  floatingButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});
