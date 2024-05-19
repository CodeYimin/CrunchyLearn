import { createContext } from "react";
import { Account } from "../types/Subtitle";

const AccountContext = createContext<Account | null>(null);
export default AccountContext;
