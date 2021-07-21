import { Account } from "../pages/Contact/Interfaces";

const ContactService = {
  emptyAccount: (): Account => {
    return {
      walletAddress: "",
      businessName: "",
      website: "",
      email: "",
      contactPerson: "",
      address: "",
      country: "",
    };
  },
};

export default ContactService;
