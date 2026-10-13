import axios from "axios";
import { toast } from "sonner";

export const api = axios.create({
    baseURL: "/api",
    timeout: 45000,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error.response?.data?.error ||
            error.message ||
            "An unexpected network error occurred.";
        toast.error(message);
        return Promise.reject(new Error(message));
    }
);

export default api;
