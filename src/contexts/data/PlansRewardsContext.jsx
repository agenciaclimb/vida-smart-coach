import { createContext, useContext } from "react";
const Ctx = createContext({});
export const PlansRewardsProvider = ({ children }) => children;
export const usePlansRewards = () => useContext(Ctx);
export default Ctx;