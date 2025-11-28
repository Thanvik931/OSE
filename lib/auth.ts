import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {    
		enabled: true,
		async sendResetPassword({ user, url }) {
			// Log the reset URL for development
			console.log("Password reset requested for:", user.email);
			console.log("Reset URL:", url);
			
			// In development, just log the URL
			// In production, you would send an actual email using a service like Resend, SendGrid, etc.
			console.log(`
============================================
PASSWORD RESET REQUEST
============================================
User: ${user.name} (${user.email})
Reset Link: ${url}

Copy this link to reset your password.
The link will expire in 1 hour.
============================================
			`);
		},
		resetPasswordTokenExpiresIn: 3600, // 1 hour in seconds
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "user",
				required: false,
				input: false,
			},
		},
	},
	plugins: [bearer()]
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}