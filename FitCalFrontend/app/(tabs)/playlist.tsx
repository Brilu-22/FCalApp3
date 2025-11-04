// FitzFrontend/app/(tabs)/playlist.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../constants/Colours';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
// Comment out or remove these imports if you don't want Firebase to be compiled at all for dummy data mode
// import { auth, db } from '../../firebaseConfig';
// import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { router } from 'expo-router';

interface Playlist {
  name: string;
  description: string;
  spotify_url: string;
  image_url?: string;
  owner: string;
  tracks_count: number;
}

// Dummy data for demonstration purposes
const dummyPlaylists: Playlist[] = [
  {
    name: "Morning Energy Boost",
    description: "Start your day with these upbeat tunes. Perfect for a morning run or intense cardio.",
    spotify_url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M", // Example Spotify URL
    image_url: "https://i.scdn.co/image/ab67706c0000da847f9c31402271cecb1662c16c", // Example image URL
    owner: "Fitness App",
    tracks_count: 45,
  },
  {
    name: "Evening Chillout Flow",
    description: "Relax and unwind with ambient and lo-fi beats. Great for stretching or meditation.",
    spotify_url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    image_url: "https://i.scdn.co/image/ab67706c0000da845c0879659e516382ac24227f",
    owner: "Zen Master",
    tracks_count: 30,
  },
  {
    name: "Workout Power Hour",
    description: "High-energy tracks to push you through your toughest workouts. EDM, Rock, and Hip-Hop.",
    spotify_url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    image_url: "https://i.scdn.co/image/ab67706c0000da84a95697666270b201f1f2e128",
    owner: "Gym Beast",
    tracks_count: 60,
  },
  {
    name: "Yoga & Mindfulness",
    description: "Soft melodies and instrumental pieces for your yoga session or mindful moments.",
    spotify_url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    image_url: "https://i.scdn.co/image/ab67706c0000da84c47ec945763b364491742460",
    owner: "Inner Peace",
    tracks_count: 25,
  },
];

interface Track {
  title: string;
  artist: string;
  albumArt?: string;
}

const dummyTracks: Track[] = [
  { title: "Blinding Lights", artist: "The Weeknd", albumArt: "https://i.scdn.co/image/ab67616d0000b2734a625807462c01140996849a" },
  { title: "Levitating", artist: "Dua Lipa", albumArt: "https://i.scdn.co/image/ab67616d0000b273d47c431b9d750c841362e5b7" },
  { title: "Old Town Road", artist: "Lil Nas X ft. Billy Ray Cyrus", albumArt: "https://i.scdn.co/image/ab67616d0000b273d61b35b674846059d43509b5" },
];


export default function PlaylistScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Simulate fetching data with a delay
    const fetchDummyPlaylists = () => {
      setLoading(true);
      setError(null);

      setTimeout(() => {
        setPlaylists(dummyPlaylists);
        // Automatically set the first dummy track as currently playing
        if (dummyTracks.length > 0) {
          setCurrentTrack(dummyTracks[0]);
          setIsPlaying(true); // Start playing immediately
        }
        setLoading(false);
      }, 1500); // 1.5 second delay
    };

    fetchDummyPlaylists();
  }, []);

  const openSpotifyLink = (url: string) => {
    // In a real app, you would use Linking from react-native
    // to open the URL in the browser or Spotify app.
    // import { Linking } from 'react-native';
    // Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    Alert.alert("Open Spotify", `Would open this playlist in Spotify: ${url}`);
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading playlists...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.red} />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.smallText}>
            This is a dummy error. In a real app, you might see a network issue or no plan generated.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Your Playlists</Text>

        {playlists.length === 0 ? (
          <Card style={styles.noPlaylistsCard}>
            <Ionicons name="musical-notes-outline" size={40} color={Colors.secondaryText} />
            <Text style={styles.noPlaylistsText}>No playlists found.</Text>
            <Text style={styles.smallText}>Generate a new workout plan to get music suggestions!</Text>
            <TouchableOpacity style={styles.generatePlanButton} onPress={() => router.push('./workouts')}>
              <Text style={styles.generatePlanButtonText}>Generate Plan</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          playlists.map((playlist, index) => (
            <Card key={index} style={styles.playlistCard}>
              <TouchableOpacity onPress={() => openSpotifyLink(playlist.spotify_url)}>
                <View style={styles.playlistContent}>
                  {playlist.image_url ? (
                    <Image source={{ uri: playlist.image_url }} style={styles.playlistImage} />
                  ) : (
                    <View style={styles.playlistImagePlaceholder}>
                      <Ionicons name="musical-note" size={40} color={Colors.primaryText} />
                    </View>
                  )}
                  <View style={styles.playlistDetails}>
                    <Text style={styles.playlistName}>{playlist.name}</Text>
                    <Text style={styles.playlistDescription}>{playlist.description}</Text>
                    <Text style={styles.playlistMeta}>{playlist.owner} • {playlist.tracks_count} tracks</Text>
                  </View>
                  <Ionicons name="play-circle" size={30} color={Colors.accent} style={styles.playIcon} />
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
// ... (previous code) ...

      {/* Music Player Section */}
      {currentTrack && (
        <View style={styles.musicPlayerContainer}>
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarBackground}>
              {/* Removed the problematic comment here, or moved it */}
              <View style={[styles.progressBarFill, { width: '40%' }]} /> 
            </View>
          </View>
          <View style={styles.playerContent}>
            {currentTrack.albumArt ? (
              <Image source={{ uri: currentTrack.albumArt }} style={styles.albumArt} />
            ) : (
              <View style={styles.albumArtPlaceholder}>
                <Ionicons name="musical-note" size={24} color={Colors.primaryText} />
              </View>
            )}
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
            <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
              <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={45} color={Colors.primaryText} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="play-skip-forward" size={30} color={Colors.primaryText} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ... (rest of the styles) ...

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primaryText,
    margin: 16,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.primaryText,
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.red,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  smallText: {
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: 5,
  },
  noPlaylistsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginHorizontal: 16,
    marginTop: 20,
  },
  noPlaylistsText: {
    color: Colors.primaryText,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  generatePlanButton: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  generatePlanButtonText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  playlistCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
  },
  playlistContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  playlistImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  playlistName: {
    color: Colors.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playlistDescription: {
    color: Colors.secondaryText,
    fontSize: 13,
    marginBottom: 4,
  },
  playlistMeta: {
    color: Colors.secondaryText,
    fontSize: 12,
  },
  playIcon: {
    marginLeft: 10,
  },
  // Music Player Styles
  musicPlayerContainer: {
    backgroundColor: Colors.background, // A slightly different background for the player
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 15,
    position: 'absolute', // Stick to the bottom
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3, // Thin progress bar
    backgroundColor: 'transparent', // So the main background shows through
  },
  progressBarBackground: {
    height: '100%',
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent, // Use accent color for progress
    borderRadius: 2,
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 5, // Space for the progress bar
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 10,
  },
  albumArtPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    marginRight: 10,
  },
  trackTitle: {
    color: Colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  trackArtist: {
    color: Colors.secondaryText,
    fontSize: 13,
  },
  playPauseButton: {
    marginRight: 15,
  },
});