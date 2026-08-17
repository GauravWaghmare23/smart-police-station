import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { useSocket } from '../../src/context/SocketContext';
import apiClient from '../../src/services/apiClient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const { isConnected, lastAnnouncement, lastSOSUpdate, lastNotification } = useSocket();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const bannerAnim = React.useRef(new Animated.Value(0)).current;

  const checkConnectivity = async () => {
    try {
      await apiClient.get('/auth/me');
      setApiStatus('connected');
    } catch {
      setApiStatus('error');
    }
  };

  // Fetch latest announcements for the banner
  const fetchAnnouncements = async () => {
    try {
      const res = await apiClient.get('/announcements');
      const list = res.data?.data?.announcements || [];
      setAnnouncements(list.slice(0, 3)); // Show latest 3
    } catch {
      // Silently fail — not critical
    }
  };

  useEffect(() => {
    checkConnectivity();
    fetchAnnouncements();
  }, []);

  // Live announcement banner slide-in
  useEffect(() => {
    if (!lastAnnouncement) return;
    setAnnouncements(prev => [lastAnnouncement, ...prev].slice(0, 3));
    Animated.sequence([
      Animated.timing(bannerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(6000),
      Animated.timing(bannerAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [lastAnnouncement]);

  // Increment unread badge on new notifications
  useEffect(() => {
    if (lastNotification) setUnreadCount(c => c + 1);
  }, [lastNotification]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([checkConnectivity(), fetchAnnouncements()]);
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const latestAnn = lastAnnouncement || (announcements.length > 0 ? announcements[0] : null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1D4ED8" />

      {/* Header */}
      <LinearGradient colors={['#1D4ED8', '#2563EB']} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{user?.name || 'Citizen'}</Text>
          <Text style={styles.tagline}>Smart Police Station · Citizen Portal</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Socket status dot */}
          <View style={[styles.connDot, { backgroundColor: isConnected ? '#34D399' : '#EF4444' }]} />
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(citizen)/profile')}
          >
            <Text style={styles.avatarText}>{(user?.name || 'C')[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Live Announcement Banner */}
      {latestAnn && (
        <Animated.View
          style={[
            styles.annBanner,
            getSeverityStyle(latestAnn.severity),
            { opacity: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
          ]}
        >
          <Ionicons name="megaphone" size={14} color="#fff" />
          <Text style={styles.annBannerText} numberOfLines={1}>
            {latestAnn.title}: {latestAnn.message}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(citizen)/notifications')}>
            <Text style={styles.annBannerLink}>View →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Prominent SOS Banner */}
        <TouchableOpacity
          style={styles.sosCard}
          onPress={() => router.push('/(citizen)/sos')}
          activeOpacity={0.9}
        >
          <View style={styles.sosCardLeft}>
            <View style={styles.sosIconCircle}>
              <Ionicons name="alert-circle" size={32} color="#DC2626" />
            </View>
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.sosCardTitle}>EMERGENCY SOS</Text>
              <Text style={styles.sosCardSub}>Tap to send GPS location to nearest police station</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Connection Status */}
        <View style={[styles.statusBox, apiStatus === 'connected' ? styles.statusSuccess : styles.statusWarning]}>
          <Ionicons
            name={apiStatus === 'connected' ? 'checkmark-circle' : 'warning'}
            size={16}
            color={apiStatus === 'connected' ? '#059669' : '#D97706'}
          />
          <Text style={[styles.statusText, { color: apiStatus === 'connected' ? '#065F46' : '#92400E' }]}>
            {apiStatus === 'connected'
              ? `Backend Connected · Socket ${isConnected ? 'Live' : 'Reconnecting...'}`
              : 'Backend connecting... (Pull to refresh)'}
          </Text>
          {isConnected && (
            <View style={styles.liveDot}>
              <Text style={styles.liveDotText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Dashboard Grid */}
        <Text style={styles.sectionTitle}>Services & Features</Text>
        <View style={styles.grid}>
          <DashboardTile
            icon="map"
            title="Police Map"
            sub="GPS & stations"
            color="#1D4ED8"
            bg="#DBEAFE"
            onPress={() => router.push('/(citizen)/map')}
          />
          <DashboardTile
            icon="document-text"
            title="Complaints"
            sub="File & track"
            color="#7C3AED"
            bg="#EDE9FE"
            onPress={() => router.push('/(citizen)/complaints')}
          />
          <DashboardTile
            icon="newspaper"
            title="My FIRs"
            sub="View FIR status"
            color="#059669"
            bg="#D1FAE5"
            onPress={() => router.push('/(citizen)/firs')}
          />
          <DashboardTile
            icon="call"
            title="Emergency"
            sub="Contacts & helplines"
            color="#D97706"
            bg="#FEF3C7"
            onPress={() => router.push('/(citizen)/emergency-contacts')}
          />
          <DashboardTile
            icon="notifications"
            title="Alerts"
            sub="Updates & announcements"
            color="#0284C7"
            bg="#E0F2FE"
            badge={unreadCount > 0 ? unreadCount : null}
            onPress={() => { setUnreadCount(0); router.push('/(citizen)/notifications'); }}
          />
          <DashboardTile
            icon="person"
            title="Profile"
            sub="Account settings"
            color="#475569"
            bg="#F1F5F9"
            onPress={() => router.push('/(citizen)/profile')}
          />
        </View>

        {/* Latest Announcements */}
        {announcements.length > 0 && (
          <View style={styles.annCard}>
            <View style={styles.annCardHeader}>
              <Ionicons name="megaphone" size={16} color="#D97706" />
              <Text style={styles.annCardTitle}>Public Safety Alerts</Text>
            </View>
            {announcements.map((ann, i) => (
              <View key={ann._id || i} style={[styles.annItem, i < announcements.length - 1 && styles.annItemBorder]}>
                <View style={[styles.annSeverityDot, getSeverityDotStyle(ann.severity)]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.annTitle} numberOfLines={1}>{ann.title}</Text>
                  <Text style={styles.annMessage} numberOfLines={2}>{ann.message}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Emergency Helplines */}
        <View style={styles.helplineCard}>
          <Ionicons name="shield-checkmark" size={20} color="#1D4ED8" />
          <Text style={styles.helplineText}>
            Emergency: <Text style={styles.boldText}>100 (Police) · 112 (National)</Text>
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function getSeverityStyle(severity) {
  const s = (severity || '').toUpperCase();
  if (s === 'CRITICAL' || s === 'HIGH') return { backgroundColor: '#DC2626' };
  if (s === 'MEDIUM') return { backgroundColor: '#D97706' };
  return { backgroundColor: '#1D4ED8' };
}

function getSeverityDotStyle(severity) {
  const s = (severity || '').toUpperCase();
  if (s === 'CRITICAL' || s === 'HIGH') return { backgroundColor: '#DC2626' };
  if (s === 'MEDIUM') return { backgroundColor: '#D97706' };
  return { backgroundColor: '#1D4ED8' };
}

function DashboardTile({ icon, title, sub, color, bg, onPress, badge }) {
  return (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{ position: 'relative' }}>
        <Ionicons name={icon} size={28} color={color} />
        {badge != null && (
          <View style={styles.tileBadge}>
            <Text style={styles.tileBadgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tileTitle, { color }]}>{title}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  greeting: { fontSize: 13, color: '#BFDBFE' },
  name: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  tagline: { fontSize: 11, color: '#93C5FD', marginTop: 2 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // Announcement banner
  annBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  annBannerText: { flex: 1, fontSize: 11, fontWeight: '600', color: '#fff' },
  annBannerLink: { fontSize: 11, fontWeight: '800', color: '#fff', textDecorationLine: 'underline' },

  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  // SOS
  sosCard: {
    backgroundColor: '#DC2626',
    borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, elevation: 6,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  sosCardLeft: { flexDirection: 'row', alignItems: 'center' },
  sosIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  sosCardTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  sosCardSub: { fontSize: 11, color: '#FECACA', marginTop: 2, maxWidth: 200 },

  // Status
  statusBox: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10,
    padding: 10, marginBottom: 16, borderWidth: 1, gap: 8,
  },
  statusSuccess: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  statusWarning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  statusText: { fontSize: 11, fontWeight: '600', flex: 1 },
  liveDot: { backgroundColor: '#059669', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  liveDotText: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  // Grid
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tile: {
    width: (width - 42) / 2, borderRadius: 14, padding: 14,
    alignItems: 'flex-start', elevation: 1,
  },
  tileTitle: { fontSize: 13, fontWeight: '700', marginTop: 10 },
  tileSub: { fontSize: 10, color: '#64748B', marginTop: 3 },
  tileBadge: {
    position: 'absolute', top: -6, right: -8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center',
  },
  tileBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Announcements card
  annCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    marginBottom: 14, elevation: 2, borderWidth: 1, borderColor: '#FEF3C7',
  },
  annCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  annCardTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  annItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  annItemBorder: { borderBottomWidth: 1, borderBottomColor: '#FEF9C3' },
  annSeverityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  annTitle: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  annMessage: { fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 16 },

  helplineCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  helplineText: { fontSize: 13, color: '#1E40AF', marginLeft: 10 },
  boldText: { fontWeight: '700' },
});
