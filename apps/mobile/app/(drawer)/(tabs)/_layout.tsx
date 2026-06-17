import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#94A3B8',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients/search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="magnify" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients/create"
        options={{
          title: 'Registrar',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="plus-box" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ayuda"
        options={{
          title: 'Ayuda',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="help-circle"
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="patients/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
