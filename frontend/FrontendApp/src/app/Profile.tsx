import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { addContactToUser, deleteContactOfUser, getContactsOfUser, getUserInfo } from "../service/user";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
    navigation: any;
}

export default function Profile({ navigation }: any) {
    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState({
        name: "",
        aadhaar: "",
        phone: "",
        email: ""
    });

    const [addContact, setAddContact] = useState({
        name: "",
        relation: "",
        phone: ""
    });

    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        fetchUserDetailes();
    }, []);

    const fetchUserDetailes = async () => {
        try {
            setLoading(true);
            const response = await getUserInfo();
            if (response.success) {
                if (response.user.emergencyContacts.length > 0) {
                    setContacts(response.user.emergencyContacts);
                }
                setUser(response.user);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to load profile details");
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async () => {
        if (!addContact.name || !addContact.phone || !addContact.relation) {
            Alert.alert("Validation", "Please enter all details");
            return;
        }
        const response = await addContactToUser(addContact);
        if (response.success) {
            setContacts(response.contacts);
            Alert.alert("Success", "Emergency contact added");
        }
    };

    const handleAddContactChange = (key: string, value: string) => {
        setAddContact((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    const deleteContact = async (id) => {
        try {
            const response = await deleteContactOfUser(id);
            if (response.success) {
                const contacts = await getContactsOfUser();
                if (contacts.success) {
                    setContacts(contacts.contacts);
                }
                Alert.alert(response.message);
            }
        } catch (error) {
            Alert.alert("Error", "Try again later");
        }
    };

    const handleDeleteContact = async (id) => {
        Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    deleteContact(id);
                },
            },
        ]);
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await AsyncStorage.removeItem("token");
                    navigation.replace("Login");
            },
        }
        ]);
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-950 px-6">
                <ActivityIndicator size="large" color="#34d399" />
                <Text className="mt-4 text-base text-slate-300">
                    Loading profile...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-slate-950" contentContainerStyle={{ padding: 20 }}>
            <View className="items-center mb-8 mt-6">
                <View className="h-24 w-24 items-center justify-center rounded-full bg-emerald-500">
                    <Text className="text-3xl font-bold text-white">{user.name[0]}</Text>
                </View>
                <Text className="mt-4 text-2xl font-bold text-white">{user.name}</Text>
                <Text className="mt-1 text-slate-400">{user.email}</Text>
            </View>

            <View className="mb-5 rounded-3xl bg-slate-900 p-5">
                <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-white">Personal Details</Text>
                    <TouchableOpacity>
                        <Feather name="edit" size={18} color="#34d399" />
                    </TouchableOpacity>
                </View>

                <Text className="mb-2 text-slate-300">Phone: {user.phone}</Text>
                <Text className="mb-2 text-slate-300">
                    Aadhaar: {user.aadhaar}
                </Text>
            </View>

            <View className="mb-5 rounded-3xl bg-slate-900 p-5">
                <Text className="mb-4 text-lg font-bold text-white">Add Emergency Contact</Text>

                <TextInput
                    placeholder="Contact name"
                    placeholderTextColor="#94a3b8"
                    value={addContact.name}
                    onChangeText={(text) => handleAddContactChange("name", text)}
                    className="mb-3 rounded-2xl bg-slate-800 px-4 py-4 text-white"
                />

                <TextInput
                    placeholder="Contact relation"
                    placeholderTextColor="#94a3b8"
                    value={addContact.relation}
                    onChangeText={(text) => handleAddContactChange("relation", text)}
                    className="mb-3 rounded-2xl bg-slate-800 px-4 py-4 text-white"
                />

                <TextInput
                    placeholder="Contact phone"
                    placeholderTextColor="#94a3b8"
                    value={addContact.phone}
                    onChangeText={(text) => handleAddContactChange("phone", text)}
                    keyboardType="phone-pad"
                    maxLength={10}
                    className="mb-3 rounded-2xl bg-slate-800 px-4 py-4 text-white"
                />

                <TouchableOpacity
                    onPress={handleAddContact}
                    className="rounded-2xl bg-emerald-500 py-4"
                >
                    <Text className="text-center text-base font-bold text-white">
                        Add Contact
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="mb-5 rounded-3xl bg-slate-900 p-5">
                <Text className="mb-4 text-lg font-bold text-white">Emergency Contacts</Text>

                {contacts.length === 0 ? (
                    <Text className="text-slate-400">No emergency contacts added</Text>
                ) : (
                    contacts.map((contact) => (
                        <View
                            key={contact._id}
                            className="mb-3 flex-row items-center justify-between rounded-2xl bg-slate-800 p-4"
                        >
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-white">
                                    {contact.name}
                                </Text>
                                <Text className="text-base font-semibold text-white">
                                    {contact.relation}
                                </Text>
                                <Text className="mt-1 text-slate-400">{contact.phone}</Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => handleDeleteContact(contact._id)}
                                className="ml-4 h-10 w-10 items-center justify-center rounded-full bg-red-500"
                            >
                                <MaterialIcons name="delete-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
            <View className="rounded-3xl bg-slate-900 p-5">
                <Text className="mb-4 text-lg font-bold text-white">Account</Text>

                <TouchableOpacity className="mb-3 rounded-2xl bg-slate-800 py-4">
                    <Text className="text-center font-semibold text-white">Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleLogout}
                    className="rounded-2xl bg-red-600 py-4"
                >
                    <Text className="text-center font-semibold text-white">Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}