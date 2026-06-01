import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    Pressable,
    Alert,
    AppState,
} from "react-native";
import MapView, {
    Marker,
    Polyline,
    PROVIDER_GOOGLE,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import polyline from "@mapbox/polyline";
import {
    getSafeRoute,
    reportUnsafeLocation,
    sendSosToContacts,
} from "../service/user";

type Props = {
    navigation: any;
};

export default function Home({ navigation }: Props) {
    const mapRef = useRef<MapView | null>(null);
    const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [startLocation, setStartLocation] = useState("");
    const [endLocation, setEndLocation] = useState("");
    const [currLocation, setCurrLocation] = useState({
        latitude: 0,
        longitude: 0,
    });
    const [loading, setLoading] = useState(true);
    const [startCoords, setStartCoords] = useState<any>(null);
    const [endCoords, setEndCoords] = useState<any>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
    const [fullRouteCoordinates, setFullRouteCoordinates] = useState<any[]>([]);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [unsafeReport, setUnsafeReport] = useState({
        type: "",
        description: "",
        latitude: 0,
        longitude: 0,
    });
    const [mapKey, setMapKey] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);
    const [useCurrentAsStart, setUseCurrentAsStart] = useState(false);

    const openSearchPopup = () => {
        setModalVisible(true);
    };

    const closeSearchPopup = () => {
        setModalVisible(false);
    };

    useEffect(() => {
        fetchLocation();

        const subscription = AppState.addEventListener("change", async (nextState) => {
            if (nextState === "active") {
                fetchLocation();
            }
        });

        return () => {
            subscription.remove();
            stopNavigationWatcher();
        };
    }, []);

    const stopNavigationWatcher = () => {
        if (locationSubscriptionRef.current) {
            locationSubscriptionRef.current.remove();
            locationSubscriptionRef.current = null;
        }
    };

    const fetchLocation = async () => {
        const location = await getCurrentLocation();
        if (location) {
            setCurrLocation(location);
            setMapKey((prev) => prev + 1);
            mapRef.current?.animateToRegion(
                {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                },
                1000
            );
        }
        setLoading(false);
    };

    const getCurrentLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
            Alert.alert("Permission denied", "Location permission is required");
            return null;
        }

        const enabled = await Location.hasServicesEnabledAsync();

        if (!enabled) {
            Alert.alert("Location Off", "Please turn on GPS/Location Services");
            return null;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        const latitude = location.coords.latitude;
        const longitude = location.coords.longitude;

        return { latitude, longitude };
    };

    const handleSendSos = async () => {
        const location = await getCurrentLocation();
        try {
            const response = await sendSosToContacts(location);
            if (response.success) {
                Alert.alert(response.message);
            }
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to send SOS");
        }
    };

    const searchLocations = async (initialText: string, finalText: string) => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert("Permission denied", "Location permission is required");
                return;
            }

            const initialResults = await Location.geocodeAsync(initialText);
            const finalResults = await Location.geocodeAsync(finalText);

            if (initialResults.length === 0 || finalResults.length === 0) {
                Alert.alert("Not found", "Could not find one or both locations");
                return;
            }

            const initialCoords = {
                latitude: initialResults[0].latitude,
                longitude: initialResults[0].longitude,
            };

            const finalCoords = {
                latitude: finalResults[0].latitude,
                longitude: finalResults[0].longitude,
            };

            return {
                initialCoords,
                finalCoords,
            };
        } catch (error) {
            console.log("Geocoding error:", error);
            Alert.alert("Error", "Failed to search location");
        }
    };

    const handleUseCurrentLocationAsStart = async () => {
        const location = await getCurrentLocation();

        if (!location) return;

        setCurrLocation(location);
        setUseCurrentAsStart(true);
        setStartLocation("Current Location");
    };

    const handleSearch = async () => {
        let location;

        if (useCurrentAsStart) {
            const finalResults = await Location.geocodeAsync(endLocation);

            if (finalResults.length === 0) {
                Alert.alert("Not found", "Could not find final location");
                return;
            }

            location = {
                initialCoords: {
                    latitude: currLocation.latitude,
                    longitude: currLocation.longitude,
                },
                finalCoords: {
                    latitude: finalResults[0].latitude,
                    longitude: finalResults[0].longitude,
                },
            };
        } else {
            location = await searchLocations(startLocation, endLocation);
        }

        if (!location) return;

        const data = {
            startLat: location.initialCoords.latitude,
            startLng: location.initialCoords.longitude,
            endLat: location.finalCoords.latitude,
            endLng: location.finalCoords.longitude,
        };

        try {
            const response = await getSafeRoute(data);

            if (response?.success && response?.safestRoute?.geometry) {
                const decodedRoute = polyline
                    .decode(response.safestRoute.geometry)
                    .map(([latitude, longitude]) => ({
                        latitude,
                        longitude,
                    }));

                setStartCoords(location.initialCoords);
                setEndCoords(location.finalCoords);
                setFullRouteCoordinates(decodedRoute);
                setRouteCoordinates(decodedRoute);
                setModalVisible(false);

                setTimeout(() => {
                    if (mapRef.current && decodedRoute.length > 0) {
                        mapRef.current.fitToCoordinates(decodedRoute, {
                            edgePadding: {
                                top: 120,
                                right: 50,
                                bottom: 180,
                                left: 50,
                            },
                            animated: true,
                        });
                    }
                }, 500);
            } else {
                Alert.alert("Error", "Could not fetch safe route");
            }
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Something went wrong while fetching route");
        }
    };

    const startNavigation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert("Permission denied", "Location permission is required");
                return;
            }

            const enabled = await Location.hasServicesEnabledAsync();

            if (!enabled) {
                Alert.alert("Location Off", "Please turn on GPS/Location Services");
                return null;
            }

            stopNavigationWatcher();
            setIsNavigating(true);

            locationSubscriptionRef.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 2000,
                    distanceInterval: 5,
                },
                (location) => {
                    const latitude = location.coords.latitude;
                    const longitude = location.coords.longitude;

                    setCurrLocation({ latitude, longitude });

                    if (fullRouteCoordinates.length > 0) {
                        const nearestIndex = getNearestRouteIndex(
                            { latitude, longitude },
                            fullRouteCoordinates
                        );

                        const remainingRoute = fullRouteCoordinates.slice(nearestIndex);

                        setRouteCoordinates(remainingRoute);
                    }

                    mapRef.current?.animateCamera(
                        {
                            center: { latitude, longitude },
                            zoom: 17,
                        },
                        { duration: 1000 }
                    );
                }
            );
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Unable to start navigation");
        }
    };

    const stopNavigation = () => {
        stopNavigationWatcher();
        setIsNavigating(false);
        setRouteCoordinates([]);
        setFullRouteCoordinates([]);
        setStartCoords(null);
        setEndCoords(null);

        setStartLocation("");
        setEndLocation("");
        setUseCurrentAsStart(false);
    };

    const openReportModal = async () => {
        const location = await getCurrentLocation();

        if (!location) return;

        setUnsafeReport({
            type: "",
            description: "",
            latitude: location.latitude,
            longitude: location.longitude,
        });

        setReportModalVisible(true);
    };

    const closeReportModal = () => {
        setReportModalVisible(false);
    };

    const handleReportChange = (key: string, value: string) => {
        setUnsafeReport((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const getDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) => {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371000;

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const getNearestRouteIndex = (
        userLocation: { latitude: number; longitude: number },
        route: { latitude: number; longitude: number }[]
    ) => {
        let nearestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < route.length; i++) {
            const point = route[i];
            const distance = getDistance(
                userLocation.latitude,
                userLocation.longitude,
                point.latitude,
                point.longitude
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
            }
        }

        return nearestIndex;
    };

    const handleSubmitUnsafeReport = async () => {
        const { type, description, latitude, longitude } = unsafeReport;

        if (!type || !description) {
            Alert.alert("Validation", "Please fill report type and description");
            return;
        }

        try {
            setReportLoading(true);
            const payload = {
                location: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                },
                type,
                description,
            };
            const response = await reportUnsafeLocation(payload);
            if (response.success) {
                Alert.alert("Success", response.message);
                setReportModalVisible(false);
                setUnsafeReport({
                    type: "",
                    description: "",
                    latitude: 0,
                    longitude: 0,
                });
            }
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to report unsafe location");
        } finally {
            setReportLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-950 px-6">
                <Text className="mt-4 text-base text-slate-300">Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-950">
            <MapView
                key={mapKey}
                ref={mapRef}
                className="flex-1"
                provider={PROVIDER_GOOGLE}
                showsUserLocation
                followsUserLocation={isNavigating}
                showsMyLocationButton
                initialRegion={{
                    latitude: currLocation.latitude,
                    longitude: currLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                {startCoords && (
                    <Marker coordinate={startCoords} title="Start Location" pinColor="green" />
                )}

                {endCoords && (
                    <Marker coordinate={endCoords} title="Final Destination" pinColor="red" />
                )}

                {routeCoordinates && routeCoordinates.length > 0 ? (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor="#10B981"
                        strokeWidth={5}
                    />
                ) : null}
            </MapView>

            <View className="absolute top-1 left-4 right-4 flex-row items-center justify-between">
                <TouchableOpacity
                    className="h-12 w-12 items-center justify-center rounded-full bg-white shadow"
                    onPress={() => navigation.navigate("Profile")}
                >
                    <Ionicons name="person-outline" size={22} color="#0f172a" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={openSearchPopup}
                    className="ml-3 flex-1 flex-row items-center rounded-2xl bg-white px-4 py-3 shadow"
                >
                    <Ionicons name="search" size={20} color="#64748b" />
                    <Text className="ml-2 text-slate-400">
                        Search initial and final location
                    </Text>
                </TouchableOpacity>
            </View>

            {routeCoordinates.length > 0 && (
                <TouchableOpacity
                    onPress={isNavigating ? stopNavigation : startNavigation}
                    className={`absolute bottom-8 left-6 rounded-2xl px-5 py-4 ${isNavigating ? "bg-red-600" : "bg-emerald-600"
                        }`}
                >
                    <Text className="font-bold text-white">
                        {isNavigating ? "Stop Navigation" : "Start Navigation"}
                    </Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                onPress={openReportModal}
                className="absolute bottom-28 right-6 rounded-full bg-amber-500 px-5 py-4 shadow-xl"
            >
                <Text className="text-sm font-bold text-white">REPORT</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={fetchLocation}
                className="absolute bottom-28 left-6 h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-xl"
            >
                <Ionicons name="locate" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleSendSos}
                className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-xl"
            >
                <Text className="text-lg font-bold text-white">SOS</Text>
            </TouchableOpacity>

            <Modal
                visible={reportModalVisible}
                transparent
                animationType="slide"
                onRequestClose={closeReportModal}
            >
                <Pressable
                    className="flex-1 justify-end bg-black/40"
                    onPress={closeReportModal}
                >
                    <Pressable
                        className="rounded-t-3xl bg-white p-6"
                        onPress={() => { }}
                    >
                        <Text className="mb-5 text-xl font-bold text-slate-900">
                            Report Unsafe Location
                        </Text>

                        <View className="mb-4 rounded-2xl bg-slate-100 px-4 py-4">
                            <TextInput
                                placeholder="Type (harassment, dark road, accident, theft, etc.)"
                                placeholderTextColor="#94a3b8"
                                value={unsafeReport.type}
                                onChangeText={(text) => handleReportChange("type", text)}
                                className="text-slate-900"
                            />
                        </View>

                        <View className="mb-4 rounded-2xl bg-slate-100 px-4 py-4">
                            <TextInput
                                placeholder="Describe what happened"
                                placeholderTextColor="#94a3b8"
                                value={unsafeReport.description}
                                onChangeText={(text) => handleReportChange("description", text)}
                                multiline
                                numberOfLines={4}
                                className="text-slate-900"
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmitUnsafeReport}
                            disabled={reportLoading}
                            className="rounded-2xl bg-amber-500 py-4"
                        >
                            <Text className="text-center text-base font-bold text-white">
                                {reportLoading ? "Submitting..." : "Submit Report"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={closeReportModal}
                            className="mt-3 rounded-2xl bg-slate-200 py-4"
                        >
                            <Text className="text-center text-base font-semibold text-slate-800">
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={closeSearchPopup}
            >
                <Pressable
                    className="flex-1 justify-end bg-black/40"
                    onPress={closeSearchPopup}
                >
                    <Pressable
                        className="rounded-t-3xl bg-white p-6"
                        onPress={() => { }}
                    >
                        <Text className="mb-5 text-xl font-bold text-slate-900">
                            Search Route
                        </Text>

                        <View className="mb-2 rounded-2xl bg-slate-100 px-4 py-4">
                            <TextInput
                                placeholder="Enter initial location"
                                placeholderTextColor="#94a3b8"
                                value={startLocation}
                                onChangeText={(text) => {
                                    setUseCurrentAsStart(false);
                                    setStartLocation(text);
                                }}
                                className="text-slate-900"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleUseCurrentLocationAsStart}
                            className="mb-4 flex-row items-center rounded-2xl bg-blue-100 px-4 py-3"
                        >
                            <Ionicons name="locate" size={18} color="#2563eb" />
                            <Text className="ml-2 font-semibold text-blue-700">
                                Use Current Location
                            </Text>
                        </TouchableOpacity>

                        <View className="mb-4 rounded-2xl bg-slate-100 px-4 py-4">
                            <TextInput
                                placeholder="Enter final destination"
                                placeholderTextColor="#94a3b8"
                                value={endLocation}
                                onChangeText={setEndLocation}
                                className="text-slate-900"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSearch}
                            className="rounded-2xl bg-teal-600 py-4"
                        >
                            <Text className="text-center text-base font-bold text-white">
                                Find Safe Route
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={closeSearchPopup}
                            className="mt-3 rounded-2xl bg-slate-200 py-4"
                        >
                            <Text className="text-center text-base font-semibold text-slate-800">
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}