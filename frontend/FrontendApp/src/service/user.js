const backendURL = process.env.VITE_BACKEND_URL;
import AsyncStorage from "@react-native-async-storage/async-storage";

export const postUserDetailes = async(formData)=>{
    const response  = await fetch(`${backendURL}/user/signup`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    })
    return await response.json();
}

export const getUserDetailes = async(data)=>{
    const response = await fetch(`${backendURL}/user/login`,{
        method: "POST",
        headers:{
            "content-Type":"application/json",
        },
        body: JSON.stringify(data)
    })
    const result = await response.json();
    if (result.token) {
        await AsyncStorage.setItem(
            "token",
            result.token
        );
    }
    return result;
}

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const sendOtp = async (data) =>{
    const response = await fetch(`${backendURL}/user/send-otp`,{
        method: "POST",
        headers:{
            "content-Type":"application/json",
        },
        body: JSON.stringify(data)
    })
    return await response.json();
}

export const verifyOtp = async (data) =>{
    const response = await fetch(`${backendURL}/user/verify-otp`,{
        method: "POST",
        headers:{
            "content-Type":"application/json",
        },
        body: JSON.stringify(data)
    })
    return await response.json();
}

export const getUserInfo = async () => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${backendURL}/user/getUserInfo`,{
            headers: {
                "Content-Type":"application/json",
                ...authHeaders,
            },
        }
    );
    const result = await response.json();
    return result;
};

export const addContactToUser = async (data) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${backendURL}/user/add-emergency-contact`,{
            method:"POST",
            headers: {
                "Content-Type":"application/json",
                ...authHeaders,
            },
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
};

export const deleteContactOfUser = async (id) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${backendURL}/user/delete-emergency-contact/${id}`,{
            method:"DELETE",
            headers: {
                "Content-Type":"application/json",
                ...authHeaders,
            },
        }
    );
    const result = await response.json();
    return result;
};


export const getContactsOfUser = async () => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${backendURL}/user/get-emergency-contacts`,{
            method:"GET",
            headers: {
                "Content-Type":"application/json",
                ...authHeaders,
            },
        }
    );
    const result = await response.json();
    return result;
};


export const sendSosToContacts = async (data) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${backendURL}/user/send-sos`,{
            method:"POST",
            headers: {
                "Content-Type":"application/json",
                ...authHeaders,
            },
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
};

export const getSafeRoute = async (data) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${backendURL}/user/get-safest-route`,{
            method:"POST",
            headers: {
                "Content-Type":"application/json",
                ...authHeaders,
            },
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
};

export const reportUnsafeLocation = async (data) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${backendURL}/user/report-unsafe-location`,{
            method:"POST",
            headers: {
                "Content-Type":"application/json",
                ...authHeaders,
            },
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
};