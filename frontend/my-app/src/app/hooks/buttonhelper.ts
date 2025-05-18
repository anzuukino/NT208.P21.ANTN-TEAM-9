import { useCallback, useState } from "react";
import { useRouter } from "next/router";

declare global {
  interface Window {
    google?: any;
  }
}

//const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "180175983654-eb9bg6s9hm9ef3ieisij8f31t0hi5f0l.apps.googleusercontent.com";


const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const requiredFields = ["firstname", "lastname", "postalcode", "email", "password", "phone_no", "identify_no"];
  const register = useCallback(
    async (formData: Record<string, string>) => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      const missingFields = requiredFields.filter((field) => !formData[field]);
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(", ")}`);
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to register");
        }
  
        setSuccess(true);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
  , []);
  return { register, loading, error, success };
}

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to login");
        }
  
        setSuccess(true);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
  , []);

  return { login, loading, error, success };
}

const useButtonClick = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const OauthClickGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/oauth", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url; // redirect to Google Auth
        setSuccess(true);
      } else {
        setError(data.error || "Failed to get Google login URL");
      }
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { OauthClickGoogle, loading, error, success };
};


const useSubmitForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitForm = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/create-fund", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit form");
      }

      const responseData = await response.json();
      setSuccess(true);
      return responseData.fund.fundID;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submitForm, loading, error, success };
};

export { useRegister, useLogin, useButtonClick, useSubmitForm };
