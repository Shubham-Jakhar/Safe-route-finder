import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SafeAreaView } from 'react-native-safe-area-context';
import SignUp from './SignUp';
import Login from './Login';
import Home from './Home';
import Profile from "./Profile";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Stack = createNativeStackNavigator();



export default function App() {

  const [route , setRoute] = useState("Login");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("token");
    if(token){
      setRoute("Home")
    }
    setLoading(false);
  };

  if(loading){
    return null;
  }
  
  return (
     <SafeAreaView className="flex-1 bg-white">
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={route}
        >
          <Stack.Screen
            name="Login"
            component={Login}
          />

          <Stack.Screen
            name="SignUp"
            component={SignUp}
          />

          <Stack.Screen
          name="Home"
          component={Home}
          />

          <Stack.Screen
          name="Profile"
          component={Profile}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}