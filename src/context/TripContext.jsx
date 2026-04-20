import { createContext, useContext, useState } from "react";

const TripContext = createContext(null);

export const TripProvider = ({ children }) => {
  const [activeTrip, setActiveTrip] = useState(null);

  return (
    <TripContext.Provider value={{ activeTrip, setActiveTrip }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);
