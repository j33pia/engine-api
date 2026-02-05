import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        accessToken?: string;
        user: {
            partnerId?: string;
        } & DefaultSession["user"]
    }

    interface User {
        accessToken?: string;
        partnerId?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        partnerId?: string;
    }
}
