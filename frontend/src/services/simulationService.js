import api from "./api";

export const getSimulationTrains = async () => {
    const response = await api.get("/simulation/trains");
    return response.data;
};

export const getSimulationTrucks = async () => {
    const response = await api.get("/simulation/trucks");
    return response.data;
};

export const getSimulationMovement = async (movementCode) => {
    const response = await api.get(
        `/simulation/movement/${movementCode}`
    );

    return response.data;
};

export const getSimulationRoute = async (routeId) => {
    const response = await api.get(
        `/simulation/routes/${routeId}`
    );

    return response.data;
};

export const getSimulationRange = async () => {
    const response = await api.get(
        "/simulation/range"
    );

    return response.data;
};

export const getSimulationState = async (timestamp) => {
    const response = await api.get(
        "/simulation/state",
        {
            params: {
                timestamp
            }
        }
    );

    return response.data;
};