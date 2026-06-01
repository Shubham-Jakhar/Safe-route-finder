import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { getUserDetailes } from "../service/user";

type Props = {
  navigation: any;
};

export default function Login({ navigation }: Props) {
  const [formData, setFormData] = useState({
    phone:"",
    password:""
  });

  const handleChange=(key:string, value:string)=>{
    setFormData((prev)=>({
      ...prev,
      [key]:value,
    }));
  }

  const handleLogin = async () => {
    const {phone, password} = formData;
    if (!phone || !password) {
      Alert.alert("Validation", "Please enter email and password");
      return;
    }
    try{
      const response = await getUserDetailes(formData);
      if(response.success){
        navigation.replace("Home");
      } else{
        Alert.alert("Invalid crdentials");
      }
    }catch(error){
      console.log("error during singup",error);
      Alert.alert("unexpected error occured, please try again later.");
    }
    
  };

  return (
    <View className="flex-1 justify-center px-6 bg-slate-950">
      <View className="mb-10">
        <Text className="text-3xl font-bold text-white">Welcome back</Text>
        <Text className="mt-2 text-base text-slate-400">
          Login to continue to Safe Route Finder
        </Text>
      </View>

      <View className="gap-4">
        <TextInput
          placeholder="Mobile no."
          placeholderTextColor="#94a3b8"
          value={formData.phone}
          onChangeText={(text)=>handleChange("phone",text)}
          keyboardType="numeric"
          className="rounded-2xl bg-slate-800 px-4 py-4 text-white"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          value={formData.password}
          onChangeText={(text)=>handleChange("password",text)}
          secureTextEntry
          className="rounded-2xl bg-slate-800 px-4 py-4 text-white"
        />

        <TouchableOpacity
          onPress={handleLogin}
          className="mt-2 rounded-2xl bg-teal-500 py-4"
        >
          <Text className="text-center text-base font-bold text-white">
            Login
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-8 flex-row justify-center">
        <Text className="text-slate-400">Don’t have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text className="font-semibold text-teal-400">Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}