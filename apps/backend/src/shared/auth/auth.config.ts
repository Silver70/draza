import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization } from "better-auth/plugins"
import { db } from "../db"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg"
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // TODO: Enable after email setup
  },

  plugins: [
    organization({
      // Organization creation settings
      allowUserToCreateOrganization: true,
      organizationLimit: 5, // Max orgs per user
      creatorRole: "owner",

      // Member settings
      membershipLimit: 50, // Max members per org

      // Invitation settings
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.FRONTEND_URL}/accept-invitation/${data.id}`
        // TODO: Implement email sending
        console.log(`📧 Invite ${data.email} to join organization`)
        console.log(`   Invite link: ${inviteLink}`)
      },
    })
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // Update every 24 hours
  }
})
