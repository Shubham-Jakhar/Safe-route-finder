import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
} from "react-native";
import { postUserDetailes, sendOtp, verifyOtp } from "../service/user";

type Props = {
    navigation: any;
};

export default function SignUp({ navigation }: Props) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        aadhaar: "",
    });

    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSendOtp = async () => {
        if (!formData.phone) {
            Alert.alert("Validation", "Please enter mobile number first");
            return;
        }

        if (formData.phone.length < 10) {
            Alert.alert("Validation", "Please enter a valid mobile number");
            return;
        }

        try {
            setOtpSent(true);
            const data ={
                phone:formData.phone
            }
            const response = await sendOtp(data);
            if (response.success) {
                Alert.alert(response.message);
            } else {
                Alert.alert(response.error);
            }
        } catch (error) {
            console.log("error sending otp", error);
            Alert.alert("Error", "Unable to send OTP");
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            Alert.alert("Validation", "Please enter OTP");
            return;
        }

        if (otp.length < 4) {
            Alert.alert("Validation", "Please enter a valid OTP");
            return;
        }

        try {
            const data = {
                phone: formData.phone,
                otp: otp
            }
            const response = await verifyOtp(data);
            if(response.success){
            setOtpVerified(true);
            Alert.alert(response.message);
            } else{
                Alert.alert(response.message);
            }
        } catch (error) {
            console.log("error verifying otp", error);
            Alert.alert("Error", "OTP verification failed");
        }
    };

    const handleSignup = async () => {
        const { name, email, password, phone, aadhaar } = formData;

        if (!name || !email || !password || !phone || !aadhaar) {
            Alert.alert("Validation", "Please fill all fields");
            return;
        }

        if (!otpVerified) {
            Alert.alert("Validation", "Please verify your mobile number first");
            return;
        }

        try {
            const response = await postUserDetailes(formData);

            if (response.success) {
                Alert.alert("Signup", "Account created successfully", [
                    {
                        text: "OK",
                        onPress: () => navigation.navigate("Login"),
                    },
                ]);
            } else {
                Alert.alert("Error", "Unexpected error occurred, please try again later.");
            }
        } catch (error) {
            console.log("error during signup", error);
            Alert.alert("Error", "Unexpected error occurred, please try again later.");
        }
    };

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="bg-slate-950"
        >
            <View className="flex-1 justify-center px-6 py-12">
                <View className="mb-10">
                    <Text className="text-3xl font-bold text-white">
                        Create account
                    </Text>
                    <Text className="mt-2 text-base text-slate-400">
                        Sign up to start using Safe Route Finder
                    </Text>
                </View>

                <View className="gap-4">
                    <TextInput
                        placeholder="Full name"
                        placeholderTextColor="#94a3b8"
                        value={formData.name}
                        onChangeText={(text) => handleChange("name", text)}
                        className="rounded-2xl bg-slate-800 px-4 py-4 text-white"
                    />

                    <TextInput
                        placeholder="Email"
                        placeholderTextColor="#94a3b8"
                        value={formData.email}
                        onChangeText={(text) => handleChange("email", text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        className="rounded-2xl bg-slate-800 px-4 py-4 text-white"
                    />

                    <View className="flex-row items-center gap-3">
                        <TextInput
                            placeholder="Mobile no."
                            placeholderTextColor="#94a3b8"
                            value={formData.phone}
                            onChangeText={(text) => handleChange("phone", text)}
                            keyboardType="phone-pad"
                            autoComplete="tel"
                            maxLength={10}
                            className="flex-1 rounded-2xl bg-slate-800 px-4 py-4 text-white"
                        />

                        <TouchableOpacity
                            onPress={handleSendOtp}
                            className="rounded-2xl bg-blue-600 px-4 py-4"
                        >
                            <Text className="font-bold text-white">Send OTP</Text>
                        </TouchableOpacity>
                    </View>

                    {otpSent && (
                        <View className="gap-3">
                            <View className="flex-row items-center gap-3">
                                <TextInput
                                    placeholder="Enter OTP"
                                    placeholderTextColor="#94a3b8"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoComplete="one-time-code"
                                    textContentType="oneTimeCode"
                                    className="flex-1 rounded-2xl bg-slate-800 px-4 py-4 text-white"
                                />

                                <TouchableOpacity
                                    onPress={handleVerifyOtp}
                                    className={`rounded-2xl px-4 py-4 ${otpVerified ? "bg-emerald-700" : "bg-emerald-500"
                                        }`}
                                >
                                    <Text className="font-bold text-white">
                                        {otpVerified ? "Verified" : "Verify"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {otpVerified && (
                                <Text className="text-sm font-medium text-emerald-400">
                                    Mobile number verified successfully
                                </Text>
                            )}
                        </View>
                    )}

                    <TextInput
                        placeholder="Aadhar no."
                        placeholderTextColor="#94a3b8"
                        value={formData.aadhaar}
                        onChangeText={(text) => handleChange("aadhaar", text)}
                        keyboardType="number-pad"
                        maxLength={12}
                        className="rounded-2xl bg-slate-800 px-4 py-4 text-white"
                    />

                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#94a3b8"
                        value={formData.password}
                        onChangeText={(text) => handleChange("password", text)}
                        secureTextEntry
                        autoComplete="new-password"
                        className="rounded-2xl bg-slate-800 px-4 py-4 text-white"
                    />

                    <TouchableOpacity
                        onPress={handleSignup}
                        className="mt-2 rounded-2xl bg-emerald-500 py-4"
                    >
                        <Text className="text-center text-base font-bold text-white">
                            Sign Up
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="mt-8 flex-row justify-center">
                    <Text className="text-slate-400">
                        Already have an account?{" "}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                        <Text className="font-semibold text-emerald-400">
                            Login
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}