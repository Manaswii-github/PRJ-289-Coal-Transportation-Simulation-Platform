import api from "./api";


export const getRakes = async () => {
    const response = await api.get("/rakes");

    return response.data;
};


export const getRake = async (rakeId) => {
    const response = await api.get(`/rakes/${rakeId}`);

    return response.data;
};


export const getRakeTelemetry = async (rakeId) => {
    const response = await api.get(
        `/rakes/${rakeId}/telemetry`
    );

    return response.data;
};