import { useCallback, useState } from "react";

const checkLogin = async () => {
  const response = await fetch("/api/user", {
    credentials: "include"
});
  if (!response.ok) {
    console.log(await response.text());
    throw new Error("Failed to check login");
  }
  return await response.json();
}

export { checkLogin };