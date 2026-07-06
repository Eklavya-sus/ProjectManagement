// lib/dal.js
import "server-only";
import { cache } from "react";
import { getSession, deleteSession } from "./session";
import { redirect } from "next/navigation";

export const verifySession = cache(async () => {
  const token = await getSession();
  if (!token) redirect("/register");
  return token;
});

export const getUser = cache(async () => {
  const token = await verifySession();
  try {
    // Call your backend API to get user data
    const response = await fetch(`${process.env.API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

   if (response.status === 401 || response.status === 400) {
      // Token is invalid, clear session
      await deleteSession()
      redirect('/register')
    }

    if (!response.ok) return null
    const user = await response.json();
    return user.userInfo;
  } catch (error) {
    console.log("Failed to fetch user:", error);
    return null;
  }
});

export const getOrganization = cache(async () => {
  const user = await getUser();
  if (!user?.organizationId) return null;

  return {
    id: user.organizationId,
  };
});

export const requireOrganization = cache(async () => {
  const user = await getUser();
  if (!user?.organizationId) {
  redirect("/create-organization");
}
return user.organizationId;
});
