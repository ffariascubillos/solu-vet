import type { ComponentProps } from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Avatar, Divider, Text } from 'react-native-paper';

function CustomDrawerContent(props: ComponentProps<typeof DrawerItemList>) {
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Avatar.Image
          size={80}
          source={{ uri: 'https://i.pravatar.cc/300?img=5' }}
          style={styles.avatar}
        />
        <Text variant="titleLarge" style={styles.userName}>
          Dra. Lola
        </Text>
        <Text variant="bodySmall" style={styles.userRole}>
          Veterinario Principal
        </Text>
      </View>

      <Divider style={styles.divider} />
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
        drawerStyle: { backgroundColor: '#0F172A', width: 280 },
        drawerActiveTintColor: '#22C55E',
        drawerInactiveTintColor: '#94A3B8',
        drawerLabelStyle: { marginLeft: 0, fontWeight: '600' },
      }}>
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Inicio',
          title: 'HuellaVet',
          drawerIcon: ({ color }) => (
            <Ionicons name="apps-outline" size={22} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Configuración',
          title: 'Ajustes',
          drawerIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={22} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    backgroundColor: '#0F172A',
    flex: 1,
  },
  drawerHeader: {
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 30,
  },
  avatar: {
    borderColor: '#22C55E',
    borderWidth: 2,
    marginBottom: 12,
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  userRole: {
    color: '#94A3B8',
  },
  divider: {
    backgroundColor: '#1E293B',
    marginHorizontal: 15,
    marginVertical: 10,
  },
});
