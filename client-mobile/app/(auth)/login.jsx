import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(citizen)/home');
    } catch (err) {
      Alert.alert('Login Error', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="shield-checkmark" size={44} color="#1D4ED8" />
          </View>
          <Text style={styles.appName}>Smart Police Station</Text>
          <Text style={styles.tagline}>Citizen Mobile Portal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Citizen Sign In</Text>
          <Text style={styles.cardSub}>Sign in to access citizen emergency services</Text>

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="citizen@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="LOGIN"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.btn}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerBold}>REGISTER</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}> Only Citizen accounts can log into this application.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F4FF' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 48, marginBottom: 28 },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  appName: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  tagline: { fontSize: 14, color: '#64748B', marginTop: 2 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  btn: { marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { marginHorizontal: 12, color: '#94A3B8', fontSize: 13 },
  registerLink: { alignItems: 'center' },
  registerText: { fontSize: 14, color: '#64748B' },
  registerBold: { color: '#1D4ED8', fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  infoText: { fontSize: 12, color: '#64748B' },
});
