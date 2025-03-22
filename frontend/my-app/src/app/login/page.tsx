import Image from "next/image";
import { MyNavBar } from "@/components/MyNavBar";
import LoginForm from "@/components/LoginForm";
import React from "react"
export default function Home() {
  return (
    <React.Fragment>
      <LoginForm></LoginForm>
    </React.Fragment>
  );
}
