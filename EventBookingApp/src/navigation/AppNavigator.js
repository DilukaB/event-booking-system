import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Main Screens
import EventListScreen from '../screens/Events/EventListScreen';
import EventDetailScreen from '../screens/Events/EventDetailScreen';
import CreateEventScreen from '../screens/Events/CreateEventScreen';
import EditEventScreen from '../screens/Events/EditEventScreen';
import MyTicketsScreen from '../screens/Tickets/MyTicketsScreen';
import TicketDetailScreen from '../screens/Tickets/TicketDetailScreen';

import { COLORS } from '../theme';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="EventList" component={EventListScreen} />
    <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
    <Stack.Screen name="EditEvent" component={EditEventScreen} />
    <Stack.Screen name="MyTickets" component={MyTicketsScreen} />
    <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
