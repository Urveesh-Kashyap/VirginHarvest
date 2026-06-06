import { useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

export const useNewsletter = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/newsletter", { email });
      toast.success("Welcome to the inner circle.");
      setEmail("");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, submit, loading };
};
