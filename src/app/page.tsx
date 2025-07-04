import { redirect } from "next/navigation";
import Image from "next/image";

export default function Home() {
  // Temporarily redirect to login page
  // In a real app, you would check for authentication here
  redirect("/login");
  
  return null;
}
